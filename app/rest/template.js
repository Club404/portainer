angular.module('portainer.rest')
  .factory('Catalogs', [
      '$resource',
      'CATALOGS_ENDPOINT',
      function CatalogsFactory($resource, CATALOGS_ENDPOINT) {
        return $resource(CATALOGS_ENDPOINT, {}, {
          get: {method: 'GET', isArray: true}
        });
      }
    ]
  )
  .factory('Template', [
      '$resource',
      'TEMPLATES_ENDPOINT',
      function TemplateFactory($resource, TEMPLATES_ENDPOINT) {
        return $resource(TEMPLATES_ENDPOINT, {}, {
          get: {method: 'GET', isArray: true}
        });
      }
    ]
  );
