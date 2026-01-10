import * as THREE from 'three';
import { Shape } from '../Shape.js';
import { GifTextureLoader } from '../../loaders/GifTextureLoader.js';

class ImageBadgeShape extends Shape {
    /**
     * Creates a new image badge shape.
     * @param {string} url - The URL of the image
     * @param {number} width - Width of the badge
     * @param {number} height - Height of the badge
     */
    constructor(url, width, height) {
        // Default to square if height not provided
        if (height === undefined) height = width;
        
        const geometry = new THREE.PlaneGeometry(width, height);
        
        const updateGeometry = (tex) => {
            const img = tex.image;
            if (img && img.width && img.height) {
                const ratio = img.width / img.height;
                const aspect = width / height;
                
                // Preserve aspect ratio by fixing the height and scaling the width
                const scaleX = ratio / aspect;
                const scaleY = 1;
                
                geometry.scale(scaleX, scaleY, 1);
                geometry.computeBoundingBox();
            }
        };

        let texture;
        const isGif = /\.gif($|\?)/i.test(url);

        if (isGif) {
             texture = new GifTextureLoader().load(url, updateGeometry);
        } else {
             texture = new THREE.TextureLoader().load(url, updateGeometry);
        }

        texture.colorSpace = THREE.SRGBColorSpace;
        
        const material = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true,
            side: THREE.DoubleSide
        });
        
        super(geometry, material);
    }
}

export { ImageBadgeShape };
