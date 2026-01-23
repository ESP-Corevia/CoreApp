export default {
  external: ['@scalar/fastify-api-reference', '@fastify/*'],
  outExtensions() {
    return { js: '.js' };
  },
};
