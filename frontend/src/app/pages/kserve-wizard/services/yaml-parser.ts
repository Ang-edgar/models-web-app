import { WizardConfig }
  from '../models/wizard.model';

export class YamlParser {

  static populateWizard(
    cr: any,
    wizard: WizardConfig,
  ): void {

    wizard.deploymentName =
      cr.metadata?.name || '';

    wizard.namespace =
      cr.metadata?.namespace || '';

    const predictor =
      cr.spec?.predictor || {};

    wizard.serviceAccount =
      predictor.serviceAccountName || 'default';

    wizard.gpuModel =
      predictor.nodeSelector?.['gpu-model'] || '';

    //
    // Built-in runtime
    //
    if (predictor.model) {

      const model =
        predictor.model;

      wizard.runtime =
        model.runtime || 'vllmserver';

      const requests =
        model.resources?.requests || {};

      const limits =
        model.resources?.limits || {};

      wizard.cpuRequest =
        requests.cpu || '1';

      wizard.cpuLimit =
        limits.cpu || '2';

      wizard.memoryRequest =
        (requests.memory || '2Gi').replace('Gi', '');

      wizard.memoryLimit =
        (limits.memory || '4Gi').replace('Gi', '');

      wizard.gpuEnabled =
        !!limits['nvidia.com/gpu'];

      wizard.gpuCount =
        limits['nvidia.com/gpu'] || '1';

      const storageUri =
        model.storageUri || '';

      if (storageUri.startsWith('pvc://')) {

        const path =
          storageUri.replace('pvc://', '');

        const slash =
          path.indexOf('/');

        if (slash > 0) {

          wizard.pvcName =
            path.substring(0, slash);

          wizard.modelPath =
            path.substring(slash + 1);
        }
      }

      return;
    }

    //
    // Custom runtime
    //
    wizard.runtime = 'custom';

    const container =
      predictor.containers?.[0] || {};

    wizard.runtimeImage =
      container.image || '';

    wizard.command =
      container.command?.slice(2).join('\n') || '';

    wizard.pvcName =
      predictor.volumes?.find(
        v => v.persistentVolumeClaim,
      )?.persistentVolumeClaim?.claimName || '';

    wizard.mountPath =
      container.volumeMounts?.[0]?.mountPath ||
      '/mnt/models';

    const requests =
      container.resources?.requests || {};

    const limits =
      container.resources?.limits || {};

    wizard.cpuRequest =
      requests.cpu || '1';

    wizard.cpuLimit =
      limits.cpu || '2';

    wizard.memoryRequest =
      (requests.memory || '2Gi').replace('Gi', '');

    wizard.memoryLimit =
      (limits.memory || '4Gi').replace('Gi', '');

    wizard.gpuEnabled =
      !!limits['nvidia.com/gpu'];

    wizard.gpuCount =
      limits['nvidia.com/gpu'] || '1';

    wizard.ports =
      container.ports?.map(p => ({
        name: p.name,
        containerPort: String(p.containerPort),
      })) || [];
  }
}