out vec3 vNormal;
out vec3 vViewPosition;

void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);

    vNormal = normalize(normalMatrix * normal);
    vViewPosition = -viewPosition.xyz;

    gl_Position = projectionMatrix * viewPosition;
}