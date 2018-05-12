// Imports
import * as cp from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as shell from 'shelljs';
import {AIO_DOWNLOADS_DIR, HIDDEN_DIR_PREFIX} from '../common/constants';
import {
  AIO_BUILDS_DIR,
  AIO_NGINX_PORT_HTTP,
  AIO_NGINX_PORT_HTTPS,
  AIO_WWW_USER,
} from '../common/env-variables';
import {computeShortSha, createLogger} from '../common/utils';

// Interfaces - Types
export interface CmdResult { success: boolean; err: Error | null; stdout: string; stderr: string; }
export interface FileSpecs { content?: string; size?: number; }

export type CleanUpFn = () => void;
export type TestSuiteFactory = (scheme: string, port: number) => void;
export type VerifyCmdResultFn = (result: CmdResult) => void;

// Classes
class Helper {

  // Properties - Protected
  protected cleanUpFns: CleanUpFn[] = [];
  protected portPerScheme: {[scheme: string]: number} = {
    http: AIO_NGINX_PORT_HTTP,
    https: AIO_NGINX_PORT_HTTPS,
  };

  private logger = createLogger('TestHelper');

  // Constructor
  constructor() {
    shell.mkdir('-p', AIO_BUILDS_DIR);
    shell.exec(`chown -R ${AIO_WWW_USER} ${AIO_BUILDS_DIR}`);
    shell.mkdir('-p', AIO_DOWNLOADS_DIR);
    shell.exec(`chown -R ${AIO_WWW_USER} ${AIO_DOWNLOADS_DIR}`);
  }

  // Methods - Public
  public cleanUp() {
    while (this.cleanUpFns.length) {
      // Clean-up fns remove themselves from the list.
      this.cleanUpFns[0]();
    }

    const leftoverDownloads = fs.readdirSync(AIO_DOWNLOADS_DIR);
    const leftoverBuilds = fs.readdirSync(AIO_BUILDS_DIR);

    if (leftoverDownloads.length) {
      this.logger.log(`Downloads directory '${AIO_DOWNLOADS_DIR}' is not empty after clean-up.`, leftoverDownloads);
      shell.rm('-rf', `${AIO_DOWNLOADS_DIR}/*`);
    }

    if (leftoverBuilds.length) {
      this.logger.log(`Builds directory '${AIO_BUILDS_DIR}' is not empty after clean-up.`, leftoverBuilds);
      shell.rm('-rf', `${AIO_BUILDS_DIR}/*`);
    }

    if (leftoverBuilds.length || leftoverDownloads.length) {
      throw new Error(`Unexpected test files not cleaned up.`);
    }
  }

  public createDummyBuild(pr: number, sha: string, isPublic = true, force = false, legacy = false) {
    const prDir = this.getPrDir(pr, isPublic);
    const shaDir = this.getShaDir(prDir, sha, legacy);
    const idxPath = path.join(shaDir, 'index.html');
    const barPath = path.join(shaDir, 'foo', 'bar.js');

    this.writeFile(idxPath, {content: `PR: ${pr} | SHA: ${sha} | File: /index.html`}, force);
    this.writeFile(barPath, {content: `PR: ${pr} | SHA: ${sha} | File: /foo/bar.js`}, force);
    shell.exec(`chown -R ${AIO_WWW_USER} ${prDir}`);

    return this.createCleanUpFn(() => shell.rm('-rf', prDir));
  }

  public getPrDir(pr: number, isPublic: boolean): string {
    const prDirName = isPublic ? '' + pr : HIDDEN_DIR_PREFIX + pr;
    return path.join(AIO_BUILDS_DIR, prDirName);
  }

  public getShaDir(prDir: string, sha: string, legacy = false): string {
    return path.join(prDir, legacy ? sha : computeShortSha(sha));
  }

  public readBuildFile(pr: number, sha: string, relFilePath: string, isPublic = true, legacy = false): string {
    const shaDir = this.getShaDir(this.getPrDir(pr, isPublic), sha, legacy);
    const absFilePath = path.join(shaDir, relFilePath);
    return fs.readFileSync(absFilePath, 'utf8');
  }

  public runCmd(cmd: string, opts: cp.ExecFileOptions = {}): Promise<CmdResult> {
    return new Promise(resolve => {
      const proc = cp.exec(cmd, opts, (err, stdout, stderr) => resolve({success: !err, err, stdout, stderr}));
      this.createCleanUpFn(() => proc.kill());
    });
  }

  public runForAllSupportedSchemes(suiteFactory: TestSuiteFactory) {
    Object.keys(this.portPerScheme).forEach(scheme => suiteFactory(scheme, this.portPerScheme[scheme]));
  }

  public verifyResponse(status: number | [number, string], regex = /^/): VerifyCmdResultFn {
    let statusCode: number;
    let statusText: string;

    if (Array.isArray(status)) {
      statusCode = status[0];
      statusText = status[1];
    } else {
      statusCode = status;
      statusText = http.STATUS_CODES[statusCode] || 'UNKNOWN_STATUS_CODE';
    }

    return (result: CmdResult) => {
      const [headers, body] = result.stdout.
        split(/(?:\r?\n){2,}/).
        map(s => s.trim()).
        slice(-2);   // In case of redirect, discard the previous headers.
                     // Only keep the last to sections (final headers and body).

      if (!result.success) {
        this.logger.log('Stdout:', result.stdout);
        this.logger.error('Stderr:', result.stderr);
        this.logger.error('Error:', result.err);
      }

      expect(result.success).toBe(true);
      expect(headers).toContain(`${statusCode} ${statusText}`);
      expect(body).toMatch(regex);
    };
  }

  public writeBuildFile(pr: number, sha: string, relFilePath: string, content: string, isPublic = true,
                        legacy = false) {
    const shaDir = this.getShaDir(this.getPrDir(pr, isPublic), sha, legacy);
    const absFilePath = path.join(shaDir, relFilePath);
    this.writeFile(absFilePath, {content}, true);
  }

  public writeFile(filePath: string, {content, size}: FileSpecs, force = false) {
    if (!force && fs.existsSync(filePath)) {
      throw new Error(`Refusing to overwrite existing file '${filePath}'.`);
    }

    let cleanUpTarget = filePath;
    while (!fs.existsSync(path.dirname(cleanUpTarget))) {
      cleanUpTarget = path.dirname(cleanUpTarget);
    }

    shell.mkdir('-p', path.dirname(filePath));
    if (size) {
      // Create a file of the specified size.
      cp.execSync(`fallocate -l ${size} ${filePath}`);
    } else {
      // Create a file with the specified content.
      fs.writeFileSync(filePath, content || '');
    }
    shell.exec(`chown ${AIO_WWW_USER} ${filePath}`);
  }

  // Methods - Protected
  protected createCleanUpFn(fn: () => void): CleanUpFn {
    const cleanUpFn = () => {
      const idx = this.cleanUpFns.indexOf(cleanUpFn);
      if (idx !== -1) {
        this.cleanUpFns.splice(idx, 1);
        fn();
      }
    };

    this.cleanUpFns.push(cleanUpFn);

    return cleanUpFn;
  }
}

interface CurlOptions {
  method?: string;
  options?: string;
  data?: any;
  url?: string;
  extraPath?: string;
}

export function makeCurl(baseUrl: string) {
  return function curl({
    method = 'POST',
    options = '',
    data = {},
    url = baseUrl,
    extraPath = '',
  }: CurlOptions) {
    const dataString = data ? JSON.stringify(data) : '';
    const cmd = `curl -iLX ${method} ` +
                `${options} ` +
                `--header "Content-Type: application/json" ` +
                `--data '${dataString}' ` +
                `${url}${extraPath}`;
    return helper.runCmd(cmd);
  };
}

export function payload(buildNum: number) {
  return {
    data: {
      payload: {
        build_num: buildNum,
        build_parameters: { CIRCLE_JOB: 'aio_preview' },
      },
    },
  };
}


// Exports
export const helper = new Helper();
