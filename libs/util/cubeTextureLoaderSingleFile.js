/*
 File: cubeTextureLoaderSingleFile.js
 Author: Rodrigo L. S. Silva
 This loader allows stripe or cross-shaped images to be used as cubemaps.
*/

import * as THREE from '../../build/three.module.js';

class CubeTextureLoaderSingleFile extends THREE.Loader {
	constructor( manager ) {
		super( manager );
	}

	loadSingle( url, whichProfile, onLoad, onProgress, onError ) {
		const texture = new THREE.CubeTexture();

      let profile = {
         mat: [],
         maxTilesPerLine: 0,
       };
      this.setProfile(profile, whichProfile)                              

		const loader = new THREE.ImageLoader( this.manager );
		loader.setCrossOrigin( this.crossOrigin );
		loader.setPath( this.path );
      
      let tempTexture = new THREE.Texture();

      loader.load( url, function ( image ) {

         const tw = image.width;
         const th = image.height;
         const tout = image.width/profile.maxTilesPerLine; 
         for( let i = 0; i < 6; i++ )
         {
            drawTileToTexture(tempTexture, image, tout, 
                              profile.mat[i][0]*tw, profile.mat[i][1]*th); // -x  2
            texture.images[ i ] = tempTexture.image;     
         }      
      }, undefined, onError );
      texture.needsUpdate = true;
		return texture;
	}

   setProfile( p, profileNumber )
   {
      //
      // Profile 1 - Cross
      //  #
      // #####
      //  #
      if(profileNumber == 1)
      {
         p.mat.push([0.50, 0.333333333]);   
         p.mat.push([0.00, 0.333333333]);         
         p.mat.push([0.25, 0.000000000]);         
         p.mat.push([0.25, 0.666666666]); 
         p.mat.push([0.25, 0.333333333]);         
         p.mat.push([0.75, 0.333333333]);   
         p.maxTilesPerLine = 4;                                   
      }

      //
      // Profile 2 - Stripe
      //  #######
      //
      if(profileNumber == 2)
      {
         p.mat.push([0.000000000, 0.0]);                                               
         p.mat.push([0.166666667, 0.0]);   
         p.mat.push([0.333333333, 0.0]);         
         p.mat.push([0.500000000, 0.0]);         
         p.mat.push([0.666666666, 0.0]); 
         p.mat.push([0.833333333, 0.0]); 
         p.maxTilesPerLine = 6;       
      }      
   }
}

function drawTileToTexture(texture, image, tileWidth, sx, sy, dx = 0, dy = 0)
{
   let canvas, context, tw = tileWidth; 
   canvas = document.createElement( 'canvas' );
   context = canvas.getContext( '2d' );
   canvas.height = tw;
   canvas.width = tw;
   context.drawImage( image, sx, sy, tw, tw, dx, dy, tw, tw );   
   texture.colorSpace = THREE.SRGBColorSpace;
   texture.image = canvas;
}

export { CubeTextureLoaderSingleFile };

