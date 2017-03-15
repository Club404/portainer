angular.module('templates', [])
  .controller('TemplatesController', ['$scope', '$q', '$state', '$anchorScroll', 'Config', 'ContainerService', 'ContainerHelper', 'ImageService', 'NetworkService', 'TemplateService', 'TemplateHelper', 'VolumeService', 'Messages', 'Pagination',
    function ($scope, $q, $state, $anchorScroll, Config, ContainerService, ContainerHelper, ImageService, NetworkService, TemplateService, TemplateHelper, VolumeService, Messages, Pagination) {
      $scope.state = {
        imageParts: {},
        selectedTemplate: null,
        showAdvancedOptions: false,
        pagination_count: Pagination.getPaginationCount('templates')
      };
      $scope.formValues = {
        name: "",
        network: "",
        bindings: []
      };

      $scope.bindTypes = [
        {
          type: "app",
          icon: "fa fa-globe",
          label: "Web Proxy",
          tags: [
            'app'
          ]
        },
        {
          type: "api",
          icon: "fa fa-gears",
          label: "REST API",
          tags: [
            'api'
          ]
        },
        {
          type: "db",
          icon: "fa fa-database",
          label: "Data Store",
          tags: [
            'db'
          ]
        },
      ];

      $scope.getServiceInfoByName = function (ident, createIfNotExists) {
        var settings = $scope.state.selectedTemplate ? $scope.state.selectedTemplate.Env || [] : [];
        var found = settings
          .filter(function (env) {
            return env.name === ident;
          });
        if (createIfNotExists && !found.length) {
          found = [
            {
              "name": ident,
              "label": ident,
              "value": ""
            }
          ];
          $scope.state.selectedTemplate.Env.push(found[0]);
        }
        return found.length ? found[0] : null;
      };

      $scope.getServiceName = function () {
        var found = $scope.getServiceInfoByName('SERVICE_NAME');
        return found ? found.value : null;
      };

      $scope.getServiceTag = function () {
        var found = $scope.getServiceInfoByName('SERVICE_TAGS');
        return found ? found.value : null;
      };

      $scope.getCurrentTags = function () {
        var current = $scope.state.selectedTemplate ? $scope.state.selectedTemplate.tags : null;
        var taggings = typeof current === 'string' ? current.split(',')
            .map(function (tag) {
              return tag ? tag.trim() : '';
            })
            .filter(function (tag) {
              return tag;
            }) : [];
        return taggings;
      };

      $scope.getSystemTags = function (inputList) {
        var reserved = $scope.bindTypes.map(function (item) {
          return item.type;
        });
        return (inputList || $scope.getCurrentTags() || [])
          .filter(function (tag) {
            var match = /(.*)(:)(.*)/g.exec(tag);
            return match ? reserved.indexOf(match[1]) >= 0 : reserved.indexOf(tag) >= 0;
          });
      };

      $scope.updateTags = function (bindings) {
        var current = $scope.getCurrentTags();
        var systemOld = $scope.getSystemTags(current);
        var userDefined = current.filter(function (tag) {
          return systemOld.indexOf(tag) < 0;
        });
        if (!bindings) {
          bindings = $scope.formValues.bindings || [];
        }
        var systemDefined = bindings.map(function (item) {
          if (item.type) {
            if (bindings.length === 1) {
              return item.type;
            } else if (bindings.length > 1) {
              var tagName = item.type + ':' + item.port.containerPort;
              if (item.name) {
                tagName = tagName + (item.name && item.name.startsWith('/') ? item.name : '/' + item.name);
              }
              return tagName;
            }
          }
        });

        if ($scope.state.selectedTemplate) {
          // Update the tag value
          $scope.state.selectedTemplate.tags = systemDefined.concat(userDefined).join(',');
        }
      };

      $scope.changePaginationCount = function () {
        Pagination.setPaginationCount('templates', $scope.state.pagination_count);
      };

      $scope.addVolume = function () {
        $scope.state.selectedTemplate.Volumes.push({containerPath: '', name: '', readOnly: false, type: 'auto'});
      };

      $scope.removeVolume = function (index) {
        $scope.state.selectedTemplate.Volumes.splice(index, 1);
      };

      $scope.addPortBinding = function () {
        $scope.state.selectedTemplate.Ports.push({hostPort: '', containerPort: '', protocol: 'tcp'});
      };

      $scope.removePortBinding = function (index) {
        $scope.state.selectedTemplate.Ports.splice(index, 1);
      };

      $scope.clearPortBindings = function (bindType, portNum) {
        $scope.formValues.bindings.forEach(function (item) {
          if (item.port) {
            item.port.binding = null;
            item.port = null;
          }
        });
        $scope.formValues.bindings = [];
        $scope.updateTags();
      };

      $scope.setPortBinding = function (bindType, portNum) {
        var ports = $scope.state.selectedTemplate.Ports || [];
        var instance = {
          name: $scope.formValues.bindings.length === 1 ? $scope.formValues.bindings[0].name : '',
          port: ports.find(function (itm) {
            return !portNum || parseInt(portNum) === parseInt(itm.containerPort);
          })
        };

        if (bindType) {
          // Clone the binding type
          angular.extend(instance, bindType);

          // Add link back to the binding
          if (instance.port) {
            var oldIndex = instance.port.binding ? $scope.formValues.bindings.indexOf(instance.port.binding) : -1;
            if (oldIndex > -1) {
              $scope.formValues.bindings.splice(oldIndex, 1);
            }
            instance.port.binding = instance;
          }

          if (!portNum) {
            // Clean old binding
            $scope.formValues.bindings = [instance];
          } else if ($scope.formValues.bindings && $scope.formValues.bindings.length) {
            // Clear any previous entries
            var target = $scope.formValues.bindings.find(function (binding) {
              return parseInt(portNum) === parseInt(binding.containerPort);
            });
            var index = !target ? -1 : $scope.formValues.bindings.indexOf(target);

            // Add the binding to the current list
            if (index > -1) {
              $scope.formValues.bindings[index] = instance;
            } else {
              $scope.formValues.bindings.push(instance);
            }
          } else {
            $scope.formValues.bindings.push(instance);
          }
        } else if (portNum) {
          // Remove the current instance (if exists)
          var toRemove = ($scope.formValues.bindings || []).find(function (item) {
            return item.port && (parseInt(item.port.containerPort) === parseInt(portNum));
          });
          var removeIndex = !toRemove ? -1 : $scope.formValues.bindings.indexOf(toRemove);
          if (removeIndex > -1) {
            $scope.formValues.bindings.slice(removeIndex, 1);
          }

          if (instance.port.binding) {
            instance.port.binding = null;
            instance.port = null;
          }
        }

        $scope.updateTags();

        return instance;
      };

      $scope.createTemplate = function () {
        $('#createContainerSpinner').show();

        if ($scope.formValues.bindings && $scope.formValues.bindings.length) {
          var serviceName = $scope.getServiceInfoByName('SERVICE_NAME', true);
          var serviceTags = $scope.getServiceInfoByName('SERVICE_TAGS', true);

          if ($scope.formValues.bindings.length === 1) {
            serviceName.value = $scope.formValues.bindings[0].name;
          }

          serviceTags.value = $scope.state.selectedTemplate.tags;
        }

        var template = $scope.state.selectedTemplate;
        var templateConfiguration = createTemplateConfiguration(template);
        var generatedVolumeCount = TemplateHelper.determineRequiredGeneratedVolumeCount(template.Volumes);

        VolumeService.createXAutoGeneratedLocalVolumes(generatedVolumeCount)
          .then(function success(data) {
            TemplateService.updateContainerConfigurationWithVolumes(templateConfiguration.container, template, data);
            return ImageService.pullImage(templateConfiguration.image);
          })
          .then(function success(data) {
            return ContainerService.createAndStartContainer(templateConfiguration.container);
          })
          .then(function success(data) {
            Messages.send('Container Started', data.Id);
            $state.go('containers', {}, {reload: true});
          })
          .catch(function error(err) {
            Messages.error('Failure', err, err.msg);
          })
          .finally(function final() {
            $('#createContainerSpinner').hide();
          });
      };

      $scope.attachTemplate = function (template) {
        console.warn(' ~> ', template);
      };

      var selectedItem = -1;
      $scope.selectTemplate = function (idx) {
        $('#template_' + idx).toggleClass("container-template--selected");
        if (selectedItem === idx) {
          unselectTemplate();
        } else {
          selectTemplate(idx);
        }
      };

      function unselectTemplate() {
        selectedItem = -1;
        $scope.state.imageParts = {};
        $scope.state.selectedTemplate = null;
      }

      function selectTemplate(idx) {
        $('#template_' + selectedItem).toggleClass("container-template--selected");
        selectedItem = idx;
        var selectedTemplate = $scope.templates[idx];
        $scope.state.selectedTemplate = angular.copy(selectedTemplate);
        $scope.formValues.bindings = [];

        // Load the service group name from meta data
        var nameFromEnv = $scope.getServiceName() || null;
        if (nameFromEnv) {
          $scope.state.selectedTemplate.name = nameFromEnv;
        }

        // Load the service group tags from meta data
        var tagsFromEnv = $scope.getServiceTag() || null;
        if (tagsFromEnv) {
          $scope.state.selectedTemplate.tags = tagsFromEnv;
        }

        // Parse the image identifier and expose the name and attributes
        var match = /(\S+\/)?([\w|\-|_]+)(:\S+)?/g.exec(selectedTemplate.Image);
        if (match) {
          $scope.state.imageParts = {
            repo: match.length > 1 && match[1] ? match[1].replace('/', '') : null,
            name: match.length > 2 && match[2] ? match[2] : null,
            tags: match.length > 3 && match[3] ? match[3].replace(':', '') : null
          };
        }

        // Parse system tags to see if there are bindings defined
        var systemTags = $scope.getSystemTags();
        if (systemTags && systemTags.length) {
          systemTags.forEach(function (item) {
            var match = /([\w|\-|_]+)(:\S+)?(\/\S+)?/g.exec(item);
            var name = match && match.length > 1 ? match[1] : item;
            var port = match && match.length > 2 ? match[2] : undefined;
            var opts = match && match.length > 3 ? match[3] : undefined;
            var bind = $scope.bindTypes.find(function (bind) {
              return bind.type === name;
            });
            var instance = $scope.setPortBinding(bind, port);
            if (instance) {
              instance.name = $scope.getServiceName();
            }
          });
        }

        // Try and auto select a default network
        if (selectedTemplate.Network) {
          $scope.formValues.network = _.find($scope.availableNetworks, function (o) {
            return o.Name === selectedTemplate.Network;
          });
        } else {
          $scope.formValues.network = _.find($scope.availableNetworks, function (o) {
            return o.Name === "bridge";
          });
        }
      }

      function createTemplateConfiguration(template) {
        var network = $scope.formValues.network;
        var name = $scope.formValues.name;
        var containerMapping = determineContainerMapping(network);
        return TemplateService.createTemplateConfiguration(template, name, network, containerMapping);
      }

      function determineContainerMapping(network) {
        var endpointProvider = $scope.applicationState.endpoint.mode.provider;
        var containerMapping = 'BY_CONTAINER_IP';
        if (endpointProvider === 'DOCKER_SWARM' && network.Scope === 'global') {
          containerMapping = 'BY_SWARM_CONTAINER_NAME';
        } else if (network.Name !== "bridge") {
          containerMapping = 'BY_CONTAINER_NAME';
        }
      }

      function filterNetworksBasedOnProvider(networks) {
        var endpointProvider = $scope.applicationState.endpoint.mode.provider;
        if (endpointProvider === 'DOCKER_SWARM' || endpointProvider === 'DOCKER_SWARM_MODE') {
          networks = NetworkService.filterGlobalNetworks(networks);
          $scope.globalNetworkCount = networks.length;
          NetworkService.addPredefinedLocalNetworks(networks);
        }
        return networks;
      }

      function initTemplates() {
        Config.$promise.then(function (c) {
          $q.all({
            catalogs: TemplateService.getCatalog(),
            templates: TemplateService.getTemplates(),
            containers: ContainerService.getContainers(0, c.hiddenLabels),
            networks: NetworkService.getNetworks(),
            volumes: VolumeService.getVolumes()
          })
            .then(function success(data) {
              $scope.catalogs = data.catalogs;
              $scope.templates = data.templates;
              $scope.runningContainers = data.containers;
              $scope.availableNetworks = filterNetworksBasedOnProvider(data.networks);
              $scope.availableVolumes = data.volumes.Volumes;
            })
            .catch(function error(err) {
              $scope.templates = [];
              Messages.error("Failure", err, "An error occured during apps initialization.");
            })
            .finally(function final() {
              $('#loadTemplatesSpinner').hide();
            });
        });
      }

      initTemplates();
    }]);
