export function createButtons()
{
    var buttons = document.getElementsByTagName("button");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("mousedown", onButtonClick, false);
        buttons[i].addEventListener("touchstart", onButtonClick, false);
        buttons[i].addEventListener("mouseup", onButtonUp, false);      
        buttons[i].addEventListener("touchend", onButtonUp, false); 
    };
    return buttons;
}