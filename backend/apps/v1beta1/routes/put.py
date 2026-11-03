from flask import request

from kubernetes.client.rest import ApiException
import time


from kubeflow.kubeflow.crud_backend import api, decorators, logging

from ...common import versions
from . import bp

log = logging.getLogger(__name__)


@bp.route(
    "/api/namespaces/<namespace>/inferenceservices/<inference_service>", methods=["PUT"]
)
@decorators.request_is_json_type
@decorators.required_body_params("apiVersion", "kind", "metadata", "spec")
def replace_inference_service(namespace: str, inference_service: str):
    gvk = versions.inference_service_gvk()
    api.authz.ensure_authorized(
        "update",
        group=gvk["group"],
        version=gvk["version"],
        resource=gvk["kind"],
        namespace=namespace,
    )

    customResource = request.get_json()

    # Detect GPU usage
    gpu_enabled = False

    try:
        containers = customResource["spec"]["predictor"]["containers"]

        for container in containers:
            gpu_count = (
                container
                .get("resources", {})
                .get("limits", {})
                .get("nvidia.com/gpu")
            )

            if gpu_count:
                gpu_enabled = True
                break

    except Exception:
        pass

    log.info(
        f"Update request for {namespace}/{inference_service}, "
        f"gpu_enabled={gpu_enabled}"
    )

    if gpu_enabled:
        log.info(
            f"GPU workload detected for {namespace}/{inference_service}, "
            "performing recreate update"
        )

        # Delete existing ISVC
        try:
            api.custom_api.delete_namespaced_custom_object(
                group=gvk["group"],
                version=gvk["version"],
                plural=gvk["kind"],
                namespace=namespace,
                name=inference_service,
            )
        except ApiException as e:
            if e.status != 404:
                raise

        # Wait until actually deleted
        for _ in range(300):  # 5 minutes
            try:
                api.custom_api.get_namespaced_custom_object(
                    group=gvk["group"],
                    version=gvk["version"],
                    plural=gvk["kind"],
                    namespace=namespace,
                    name=inference_service,
                )

                time.sleep(1)

            except ApiException as e:
                if e.status == 404:
                    time.sleep(3)
                    break

                raise
        else:
            raise RuntimeError(
                f"Timed out waiting for InferenceService "
                f"{namespace}/{inference_service} deletion"
            )

        # Recreate with new spec
        api.custom_api.create_namespaced_custom_object(
            group=gvk["group"],
            version=gvk["version"],
            plural=gvk["kind"],
            namespace=namespace,
            body=customResource,
        )

        return api.success_response(
            "message",
            "InferenceService successfully recreated",
        )

    # Non-GPU workloads keep existing behavior
    api.custom_api.replace_namespaced_custom_object(
        group=gvk["group"],
        version=gvk["version"],
        plural=gvk["kind"],
        namespace=namespace,
        name=inference_service,
        body=customResource,
    )

    return api.success_response(
        "message",
        "InferenceService successfully updated",
    )


@bp.route(
    "/api/namespaces/<namespace>/inferencegraphs/<inference_graph>", methods=["PUT"]
)
@decorators.request_is_json_type
@decorators.required_body_params("apiVersion", "kind", "metadata", "spec")
def replace_inference_graph(namespace: str, inference_graph: str):
    """Handle update of an InferenceGraph."""
    gvk = versions.inference_graph_gvk()
    api.authz.ensure_authorized(
        "update",
        group=gvk["group"],
        version=gvk["version"],
        resource=gvk["kind"],
        namespace=namespace,
    )

    customResource = request.get_json()

    api.custom_api.replace_namespaced_custom_object(
        group=gvk["group"],
        version=gvk["version"],
        plural=gvk["kind"],
        namespace=namespace,
        name=inference_graph,
        body=customResource,
    )

    return api.success_response("message", "InferenceGraph successfully updated")
