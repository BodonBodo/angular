import {
  NESTED_FORMATTED_RECORD,
  NESTED_RECORD,
  SIMPLE_FORMATTED_RECORD,
  SIMPLE_RECORD,
} from './flamegraph-formatter-spec-constants';
import { FlamegraphFormatter, FlamegraphNode } from './flamegraph-formatter';
import { AppEntry } from '../record-formatter';

const formatter = new FlamegraphFormatter();

describe('addFrame cases', () => {
  let entry: AppEntry<FlamegraphNode>;
  let timeSpent;

  beforeEach(() => {
    entry = {
      app: [],
      timeSpent: 0,
      source: '',
    };
  });

  it('add frame for simple case', () => {
    timeSpent = formatter.addFrame(entry.app, SIMPLE_RECORD);
    expect(timeSpent).toBe(17);
    expect(entry.app).toEqual(SIMPLE_FORMATTED_RECORD);
  });

  it('add frame for deeply nested records', () => {
    timeSpent = formatter.addFrame(entry.app, NESTED_RECORD);
    expect(timeSpent).toBe(21);
    expect(entry.app).toEqual(NESTED_FORMATTED_RECORD);
  });
});
