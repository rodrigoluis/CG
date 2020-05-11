AFRAME.registerComponent('touch-listener', {
  init: function () {
    var targetEl = this.el;

    //Create the touchstart event
    document.querySelector('a-scene').addEventListener('touchstart', function () {
      targetEl.emit('starttouch')
    })

    document.querySelector('a-scene').addEventListener('mousedown', function () {
      targetEl.emit('starttouch')
    })

    document.body.addEventListener('keydown', function (e) {
      if (e.keyCode == 32) {
        console.log('space key pressed!');
        targetEl.emit('starttouch');      
      }  
    })
    
    //Create the touchend event
    document.querySelector('a-scene').addEventListener('touchend', function () {
      targetEl.emit('endtouch')
    })
    
    document.querySelector('a-scene').addEventListener('mouseup', function () {
      targetEl.emit('endtouch')
    })
    
    document.body.addEventListener('keyup', function (e) {
      if (e.keyCode == 32) {
        console.log('space key released!');
        targetEl.emit('endtouch');      
      }  
    })

    
  }
});
