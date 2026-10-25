out vec4 color;

void main()
{
    gl_Position = projectionMatrix
                * modelViewMatrix
                * vec4(position, 1.0);
}