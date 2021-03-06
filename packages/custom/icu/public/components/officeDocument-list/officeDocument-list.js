'use strict';

function OfficeDocumentListController($scope, $state, BoldedService, NotifyingService, officeDocuments, OfficeDocumentsService, MultipleSelectService, context, $stateParams, EntityService) {

    $scope.items = officeDocuments.data || officeDocuments;

    $scope.entityName = 'officeDocuments';
    $scope.entityRowTpl = '/icu/components/officeDocument-list/officeDocument-row.html';

    $scope.update = function(item) {
        return OfficeDocumentsService.update(item);
    }

  $scope.getBoldedClass = function(entity){
    return BoldedService.getBoldedClass(entity, 'officeDocuments');
  };

    $scope.create = function(parent) {
        var data = {};
        if(parent){
            data.folder = parent.id;
        }
        //         if ($stateParams.entity == 'folder') {
        //             data['folder'] = $stateParams.entityId;
        //         }

        return OfficeDocumentsService.createDocument(data).then(function(result) {
            result.created = new Date(result.created);
            $scope.items.push(result);
            //             if (localStorage.getItem('type') == 'new') {
            //                 if (context.entityName == 'folder') {
            //                     $scope.items = $scope.items.filter(function(officeDocument) {
            //                         return officeDocument.status == 'new' && officeDocument.folder && officeDocument.folder._id == context.entityId;
            //                     });

            //                 } else {

            //                     $scope.items = $scope.items.filter(function(officeDocument) {
            //                         return officeDocument.status == 'new';
            //                     });

            //                 }
            //             }
            return result;
        });
    }

    //     $scope.search = function(item) {
    //         return OfficeDocumentsService.search(term).then(function(searchResults) {
    //             _(searchResults).each(function(sr) {
    //                 var alreadyAdded = _($scope.items).any(function(p) {
    //                     return p._id === sr._id;
    //                 });

    //                 if (!alreadyAdded) {
    //                     return $scope.searchResults.push(sr);
    //                 }
    //             });
    //             $scope.selectedSuggestion = 0;
    //         });
    //     }

    $scope.order = {
        field: $stateParams.sort || 'created',
        order: 1
    };

    var creatingStatuses = {
      NotCreated: 0,
      Creating: 1,
      Created: 2
    };

    $scope.loadNext = officeDocuments.next;
    $scope.loadPrev = officeDocuments.prev;

    $scope.loadMore = function (start, LIMIT, sort) {
      var sCallerName;
      {
        let re = /([^(]+)@|at ([^(]+) \(/g;
        let aRegexResult = re.exec(new Error().stack);
        sCallerName = aRegexResult[1] || aRegexResult[2];
      }
      console.log(sCallerName);


      return new Promise((resolve) => {
        if (!$scope.isLoading && $scope.loadNext) {
          $scope.isLoading = true;
          return $scope.loadNext()
            .then(function (items) {
              _(items.data).each(function (p) {
                p.__state = creatingStatuses.Created;
              });

              var offset = $scope.displayOnly ? 0 : 1;

              if (items.data.length) {
                var index = $scope.items.length - offset;
                var args = [index, 0].concat(items.data);

                [].splice.apply($scope.items, args);
              }

              $scope.loadNext = items.next;
              $scope.loadPrev = items.prev;
              $scope.isLoading = false;

              return resolve(items.data);
            });
        }
        return resolve([]);
      })
    };

    // $scope.loadMore = function() {
    //     var LIMIT = 25 ;
    //     var start = $scope.items.length;
    //     var sort = $scope.order.field;
    //     return loadNext(start, LIMIT, sort);
    // };

    function loadNext(start, LIMIT, sort){
        return OfficeDocumentsService.getAll(start , LIMIT , sort)
            .then(function(docs){
                $scope.items = $scope.items.concat(docs.data);
                $scope.items = _.uniq($scope.items, _.property('_id'));
                return docs.data;
            });
    }
}

angular.module('mean.icu.ui.officedocumentlist', []).controller('OfficeDocumentListController', OfficeDocumentListController);
