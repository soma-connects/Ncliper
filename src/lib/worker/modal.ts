/**
 * Modal Worker Client
 * Invokes the deployed Modal worker function
 */

// Modal function details
const MODAL_APP_NAME = "ncliper-worker";
const MODAL_FUNCTION_NAME = "process_video";

export interface ModalProcessVideoParams {
    job_id: string;
    project_id: string;
    video_url: string;
    settings: {
        width?: number;
        height?: number;
        clip_count?: number;
    };
}

export interface ModalProcessVideoResult {
    clips: Array<{
        id: string;
        title: string;
        url: string; // R2 HTTPS URL
        virality_score: number;
        start_time: number;
        end_time: number;
        segments: Array<{ start: number; end: number }>;
    }>;
    metadata: {
        title: string;
        duration: number;
        hooks_found: number;
        status?: string;
    };
}

/**
 * Invoke the Modal worker to process a video
 * This calls the deployed serverless function
 */
export async function invokeModalWorker(
    params: ModalProcessVideoParams
): Promise<ModalProcessVideoResult> {
    // Modal web endpoints expect function.call() or .remote() from Python
    // For HTTP access, we need to enable web_endpoint in the function decorator
    // For now, we'll trigger via the function's web endpoint
    const modalWebhookUrl = `https://${process.env.MODAL_USERNAME || 'soma-connects'}--ncliper-worker-process-video-app.modal.run`;

    console.log('[Modal] Invoking worker:', params.job_id);

    // Modal expects JSON body for web endpoint POST
    const response = await fetch(modalWebhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            job_id: params.job_id,
            project_id: params.project_id,
            video_url: params.video_url,
            settings: params.settings
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Modal worker failed: ${error}`);
    }

    const result = await response.json();
    console.log('[Modal] Worker completed:', params.job_id);

    return result as ModalProcessVideoResult;
}
