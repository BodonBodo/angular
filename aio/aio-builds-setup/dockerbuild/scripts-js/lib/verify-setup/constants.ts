export const enum BuildNums {
  BUILD_INFO_ERROR = 1,
  BUILD_INFO_404,
  BUILD_INFO_INVALID_GH_ORG,
  BUILD_INFO_INVALID_GH_REPO,
  PIPELINE_INFO_ERROR,
  PIPELINE_INFO_404,
  CHANGED_FILES_ERROR,
  CHANGED_FILES_404,
  CHANGED_FILES_NONE,
  BUILD_ARTIFACTS_ERROR,
  BUILD_ARTIFACTS_404,
  BUILD_ARTIFACTS_EMPTY,
  BUILD_ARTIFACTS_MISSING,
  DOWNLOAD_ARTIFACT_ERROR,
  DOWNLOAD_ARTIFACT_404,
  DOWNLOAD_ARTIFACT_TOO_BIG,
  TRUST_CHECK_ERROR,
  TRUST_CHECK_UNTRUSTED,
  TRUST_CHECK_TRUSTED_LABEL,
  TRUST_CHECK_ACTIVE_TRUSTED_USER,
  TRUST_CHECK_INACTIVE_TRUSTED_USER,
}

export const enum PipelineIds {
  PIPELINE_INFO_ERROR = 'pipeline-error',
  PIPELINE_INFO_404 = 'pipeline-404',
  CHANGED_FILES_ERROR = 'pipeline-cfe',
  CHANGED_FILES_404 = 'pipeline-cf404',
  CHANGED_FILES_NONE = 'pipeline-cfn',
  TRUST_CHECK_ERROR = 'pipeline-tce',
  TRUST_CHECK_UNTRUSTED = 'pipeline-tcu',
  PIPELINE_INFO_OK = 'pipeline-ok',
}

export const enum PrNums {
  CHANGED_FILES_ERROR = 1,
  CHANGED_FILES_404,
  CHANGED_FILES_NONE,
  TRUST_CHECK_ERROR,
  TRUST_CHECK_UNTRUSTED,
  TRUST_CHECK_TRUSTED_LABEL,
  TRUST_CHECK_ACTIVE_TRUSTED_USER,
  TRUST_CHECK_INACTIVE_TRUSTED_USER,
}

export const SHA = '1234567890'.repeat(4);
export const ALT_SHA = 'abcde'.repeat(8);
export const SIMILAR_SHA = SHA.slice(0, -1) + 'A';
