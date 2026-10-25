in vec3 vNormal;
in vec3 vViewPosition;

uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform vec3 objectColor;

uniform float shininess;

out vec4 fragColor;

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(lightPosition - vViewPosition);
    vec3 V = normalize(vViewPosition);
    vec3 R = reflect(-L, N);

    // Componente ambiente
    vec3 ambient = 0.1 * objectColor;

    // Componente difusa
    float diff = max(dot(N, L), 0.0);
    vec3 diffuse = diff * lightColor * objectColor;

    // Componente especular
    float spec = 0.0;

    if (diff > 0.0) {
        spec = pow(max(dot(R, V), 0.0), shininess);
    }

    vec3 specular = spec * lightColor;

    vec3 result = ambient + diffuse + specular;

    fragColor = vec4(result, 1.0);
}