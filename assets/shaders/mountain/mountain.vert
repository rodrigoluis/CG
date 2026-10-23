out float vHeight;
out vec3 vNormal;

void main()
{
    vHeight = position.y;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    vNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}