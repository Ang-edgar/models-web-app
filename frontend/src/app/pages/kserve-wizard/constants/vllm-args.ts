// constants/vllm-args.ts
import { RuntimeArgDefinition }
  from '../models/runtime-arg-definition.model';

export const VLLM_ARGS: RuntimeArgDefinition[] = [

  {
    argument: '--served-model-name',
    label: 'Served Model Name',
    defaultValue: '',
  },
  {
    argument: '--gpu-memory-utilization',
    label: 'GPU Memory Utilization',
    defaultValue: '0.9',
  },
  {
    argument: '--tensor-parallel-size',
    label: 'Tensor Parallel Size',
    defaultValue: '1',
  },
  {
    argument: '--max-model-len',
    label: 'Max Model Len',
    defaultValue: '32768',
  },
  {
    argument: '--max-num-seqs',
    label: 'Max Num Seqs',
    defaultValue: '5',
  },
  {
    argument: '--max-num-batched-tokens',
    label: 'Max Batched Tokens',
    defaultValue: '16384',
  },
  {
    argument: '--reasoning-parser',
    label: 'Reasoning Parser',
    defaultValue: '',
  },
  {
    argument: '--host',
    label: 'Host',
    defaultValue: '0.0.0.0',
  },
  {
    argument: '--port',
    label: 'Port',
    defaultValue: '8080',
  },
  {
    argument: '--limit-mm-per-prompt',
    label: 'Images Per Prompt',
    defaultValue: '{"image":4}',
  },
  {
    argument: '--disable-custom-all-reduce',
    label: 'Disable Custom All Reduce',
    defaultValue: '',
  },
  {
    argument: '--enable-prefix-caching',
    label: 'Enable Prefix Caching',
    defaultValue: '',
  },
  {
    argument: '--distributed-executor-backend',
    label: 'Executor Backend',
    defaultValue: 'ray',
  },
  {
    argument: '--enforce-eager',
    label: 'Enforce Eager',
    defaultValue: '',
  },
  {
    argument: '--dtype',
    label: 'Data Type',
    defaultValue: 'auto',
  },
  {
    argument: '--kv-cache-dtype',
    label: 'KV Cache Type',
    defaultValue: 'auto',
  },
  {
    argument: '--swap-space',
    label: 'Swap Space (GiB)',
    defaultValue: '4',
  },
];