from kubernetes import client
from kubeflow.kubeflow.crud_backend import api, logging

from .. import utils, versions
from . import bp

@bp.route(
    "/api/namespaces/<namespace>/inferenceservices/<name>/stop",
    methods=["POST"],
)
def stop_inference_service(namespace, name):

    isvc = api.get_custom_rsrc(
        **versions.inference_service_gvk(),
        namespace=namespace,
        name=name,
    )

    apps_api = client.AppsV1Api()

    for deployment_name in utils.get_isvc_deployment_names(isvc):

        apps_api.patch_namespaced_deployment_scale(
            deployment_name,
            namespace,
            {
                "spec": {
                    "replicas": 0,
                },
            },
        )

    return api.success_response(
        "message",
        f"InferenceService {namespace}/{name} stopped.",
    )

@bp.route(
    "/api/namespaces/<namespace>/inferenceservices/<name>/start",
    methods=["POST"],
)

def start_inference_service(namespace, name):

    isvc = api.get_custom_rsrc(
        **versions.inference_service_gvk(),
        namespace=namespace,
        name=name,
    )

    apps_api = client.AppsV1Api()

    for deployment_name in utils.get_isvc_deployment_names(isvc):

        apps_api.patch_namespaced_deployment_scale(
            deployment_name,
            namespace,
            {
                "spec": {
                    "replicas": 1,
                },
            },
        )

    return api.success_response(
        "message",
        f"InferenceService {namespace}/{name} started.",
    )