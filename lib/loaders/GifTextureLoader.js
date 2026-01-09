import * as THREE from 'three';

class GifTextureLoader extends THREE.Loader {
    constructor(manager) {
        super(manager);
    }

    load(url, onLoad, onProgress, onError) {
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 2;
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter; 
        texture.generateMipmaps = false; 
        texture.flipY = true;

        const loader = new THREE.FileLoader(this.manager);
        loader.setPath(this.path);
        loader.setResponseType('arraybuffer');
        loader.setRequestHeader(this.requestHeader);
        loader.setWithCredentials(this.withCredentials);

        loader.load(url, async (buffer) => {
            if (typeof ImageDecoder === 'undefined') {
                if (onError) onError(new Error('ImageDecoder API not supported'));
                this.fallbackToStatic(url, texture, onLoad, onError);
                return;
            }

            try {
                const decoder = new ImageDecoder({ data: buffer, type: 'image/gif' });
                await decoder.tracks.ready;
                const track = decoder.tracks.selectedTrack;
                
                // console.log(`[GifTextureLoader] GIF initialized. Tracks: ${decoder.tracks.length}, FrameCount: ${track.frameCount}`);

                let frameIndex = 0;
                let isFirstFrame = true;

                const renderLoop = async () => {
                    if (texture.userData.isDisposed) {
                         return;
                    }

                    try {
                        const result = await decoder.decode({ frameIndex });
                        const frame = result.image;
                        
                        const canvas = texture.image;
                        
                        if (frame.displayWidth > 0 && frame.displayHeight > 0) {
                            if (canvas.width !== frame.displayWidth || canvas.height !== frame.displayHeight) {
                                // console.log(`[GifTextureLoader] Resizing canvas to ${frame.displayWidth}x${frame.displayHeight}`);
                                canvas.width = frame.displayWidth;
                                canvas.height = frame.displayHeight;
                                
                                // Mark as internal dispose so we don't stop the loop
                                texture.userData.isInternalDispose = true;
                                texture.dispose(); 
                                texture.userData.isInternalDispose = false;
                            }
                        }

                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(frame, 0, 0);
                        
                        const duration = frame.duration; 
                        frame.close(); 

                        texture.needsUpdate = true;

                        if (isFirstFrame) {
                            isFirstFrame = false;
                            if (onLoad) onLoad(texture);
                        }

                        frameIndex = (frameIndex + 1) % track.frameCount;
                        
                        let durationUs = duration;
                        if (!durationUs || durationUs <= 10000) {
                             durationUs = 100000;
                        }
                        const delayMs = durationUs / 1000;
                        
                        setTimeout(renderLoop, delayMs);

                    } catch (e) {
                         console.error('[GifTextureLoader] Error in render loop:', e);
                         setTimeout(renderLoop, 1000);
                    }
                };

                renderLoop();

            } catch (e) {
                console.warn('GifTextureLoader: ImageDecoder init failed, falling back.', e);
                this.fallbackToStatic(url, texture, onLoad, onError);
            }

        }, onProgress, (err) => {
             console.warn('GifTextureLoader: File fetch failed.', err);
             if (onError) onError(err);
        });

        const originalDispose = texture.dispose;
        texture.dispose = function() {
            if (!texture.userData.isInternalDispose) {
                texture.userData.isDisposed = true;
            }
            originalDispose.call(this);
        };

        return texture;
    }

    fallbackToStatic(url, texture, onLoad, onError) {
        const staticLoader = new THREE.TextureLoader(this.manager);
        staticLoader.setPath(this.path);
        staticLoader.setCrossOrigin(this.crossOrigin);
        staticLoader.load(url, (t) => {
            texture.image = t.image;
            texture.colorSpace = t.colorSpace;
            texture.needsUpdate = true;
            if (onLoad) onLoad(texture);
        }, undefined, onError);
    }
}

export { GifTextureLoader };

