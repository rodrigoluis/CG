/*
 *
 * Class to control Multimarker setup
 * TODO: Create a "changePosition" method to allow the creation of a single objet
 *       instead of one object per marker.
 * 
 */


function MarkerObject() {
   this.pattern = 0;
   this.x = 0.0;
   this.y = 0.0;
   this.z = 0.0;      
   this.visible = false;
}

export default class ARMultimarkerManager{
	constructor() {
      this.markers = [];
	}
   add(pattern, x, y, z)
   {
      var marker = new MarkerObject();
      marker.pattern = pattern;
      marker.x = x;
      marker.y = y;
      marker.z = z;
      this.markers.push(marker);
   }

   get(id)
   {
      if(this.markers[id]) return this.markers[id];
   }

   // Only one object is visible when rendering the scene
   changeVisibility(AR)
   {
      // Store visibility of each marker and set corresponding visibility to false
      for(let i = 0; i < this.markers.length; i++)
      {
         this.markers[i].visible = AR.context._arMarkersControls[i].object3d.visible;
         AR.context._arMarkersControls[i].object3d.visible = false;
      }

      // Make visible only the first marker available
      for(let i = 0; i < this.markers.length; i++)
      {
         if(this.markers[i].visible)
         {
            AR.context._arMarkersControls[i].object3d.visible = true;
            return i;
         }
      }
   }

   // --- UNDER DEVELOPMENT ---
   // changePosition(AR, object = null)
   // {
   //    // Store visibility of each marker and set corresponding visibility to false
   //    for(let i = 0; i < this.markers.length; i++)
   //    {
   //       this.markers[i].visible = AR.context._arMarkersControls[i].object3d.visible;
   //       AR.context._arMarkersControls[i].object3d.visible = false;
   //    }

   //    // Make visible only the first marker available
   //    for(let i = 0; i < this.markers.length; i++)
   //    {
   //       if(this.markers[i].visible)
   //       {
   //          AR.context._arMarkersControls[i].object3d.visible = true;
   //          if(object) // if available, copy position and orientation
   //          {
   //             AR.context._arMarkersControls[i].object3d.visible = false;               
   //             let tempObj = AR.context._arMarkersControls[i].object3d;               
   //             object.position.copy(tempObj.position);               
   //             object.quaternion.copy(tempObj.quaternion);           
   //             object.visible = true; 

   //             console.log(tempObj)
   //             console.log(object)
   //          }
   //          return i;
   //       }
   //    }
   //    if(object) object.visible = false;
   // }   
}
