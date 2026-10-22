varying float vHeight;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main()
{
    vHeight = position.y;

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    vNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * modelViewMatrix
                * vec4(position, 1.0);
}