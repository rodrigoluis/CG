in float vHeight;
in vec3 vNormal;
out vec4 fragColor;

void main() {
   vec3 sand = vec3(0.76, 0.64, 0.42);
   vec3 grass = vec3(0.18, 0.42, 0.16);
   vec3 snow = vec3(0.95, 0.97, 1.0);

   vec3 color;

   if(vHeight < 0.35) {
      color = sand;
   } else if(vHeight < 1.5) {
      color = grass;
   } else {
      color = snow;
   }

   // Normal da superfície no espaço de mundo
   vec3 normal = normalize(vNormal);

   // Direção da luz
   vec3 lightDirection = normalize(vec3(-0.5, 1.0, 0.4));

   // Iluminação ambiente
   float ambient = 0.25;

   // Iluminação difusa Lambert
   float diffuse = max(dot(normal, lightDirection), 0.0);

   // Combinação das iluminações
   vec3 finalColor = color * (ambient + 0.75 * diffuse);

   fragColor = vec4(finalColor, 1.0);
}
