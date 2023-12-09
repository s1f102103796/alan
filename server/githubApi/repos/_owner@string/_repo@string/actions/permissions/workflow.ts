import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  put: {
    reqBody: { default_workflow_permissions: 'read' | 'write' };
  };
}>;
