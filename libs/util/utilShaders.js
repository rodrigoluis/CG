export async function loadShaders(path, vertexFile, fragmentFile) {
    const [vertexShader, fragmentShader] = await Promise.all([
        fetch(`${path}/${vertexFile}`).then(response => {
            if (!response.ok) {
                throw new Error(
                    `Não foi possível carregar o vertex shader: ${vertexFile}`
                );
            }
            return response.text();
        }),

        fetch(`${path}/${fragmentFile}`).then(response => {
            if (!response.ok) {
                throw new Error(
                    `Não foi possível carregar o fragment shader: ${fragmentFile}`
                );
            }
            return response.text();
        })
    ]);
    return { vertexShader, fragmentShader };
}