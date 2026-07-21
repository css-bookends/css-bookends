import { expectAssignable } from 'tsd';

import { type ErrorCode } from '../../dist/index';

// The scalar core emits three arithmetic-contract codes (non-finiteness and divide-by-zero) for
// m / i / f / u AND ratio, so they are MEMBERS of the public `ErrorCode` union. These lock that
// membership: red while the codes were retired (a plain string literal not assignable to the
// union), green once they are restored.
expectAssignable<ErrorCode>('CALIPERS_E_DIVIDE_BY_ZERO');
expectAssignable<ErrorCode>('CALIPERS_E_NONFINITE');
expectAssignable<ErrorCode>('CALIPERS_E_NONFINITE_RESULT');
