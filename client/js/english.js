DOMAIN = 'http://192.168.1.168';
// DOMAIN = 'http://localhost';
base_url = DOMAIN + ':9000';
image_url = base_url + "/image/";

user = {};
user.hasRole = function (role) {
    return false;
};

function login() {
    var email = $("#email").val();
    var pass = $("#password").val();
    $.ajax({
        url: base_url + "/oauth/token",
        method: "POST",
        crossDomain: true,
        dataType: "json",
        data: {"grant_type": "password", "username": email, "password": pass},
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa("english:password"));
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
        },
        success: function (data) {
            createCookie("token", data.access_token, data.expires_in);
            document.location.href = "./index.html";
        },
        error: function (error) {
            var result = JSON.parse(error.responseText);
            if (result.error) {
                $('#login_error').html(result.error == 'invalid_grant' ? "Логин или пароль не совпадают." : result.error_description);
                $('#login_error').show();
            }
        }
    });
}

function regUser() {
    var email = $("#reg-email").val();
    var pass = $("#reg-password").val();
    $.ajax({
        url: base_url + "/registration",
        method: "POST",
        dataType: "json",
        data: JSON.stringify({
            "email": email,
            "password": pass
        }),
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Content-type", "application/json; charset=utf-8");
        },
        success: function (data) {
            if (data.error) {
                $('#reg-error').html(data.error);
                $('#reg-error').show();
            } else {
                location.reload();
            }
        },
        error: function (error) {
            console.log("ERROR: ", error);
        }
    });
}

function loadUser(f) {
    var token = readCookie("token");
    if (token != null && token != "") {
        $.ajax({
            url: base_url + '/user/current',
            type: 'GET',
            dataType: "json",
            crossDomain: true,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + token);
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
            },
            success: function (data) {
                user = data;
                user.hasRole = function (role) {
                    return user.authorities.some(
                        function (r) {
                            return r.authority == role;
                        }
                    );
                };
                closeDialog(data);
            },
            error: function (data) {
                console.log(JSON.parse(data.responseText).error_description);
            }
        });
    }
}

function logOut() {
    console.log("logOut");
    $.ajax({
        url: base_url + "/revoke",
        method: "GET",
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + readCookie("token"));
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
        },
        success: function (data) {
            createCookie("token", "");
            location.reload();
        },
        error: function (error) {
            createCookie("token", "");
            location.reload();
        }
    });
}


function addCard() {
    var data = new FormData($("#add-card")[0]);
    $.ajax({
        url: base_url + "/admin/add-card",
        method: "POST",
        contentType: false,
        data: data,
        processData: false,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + readCookie("token"));
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
        },
        success: function () {
            document.location.href = "#!/";
        },
        error: function (error) {
            console.log("ERROR: ", error);
        }
    });
}

function isAdmin() {
    return user.hasRole("admin");
}

function closeDialog(data) {
    $('#logout-item').show();
    $('#login-page').hide();
    $('#user-info').html(data.name);
    if (isAdmin()) {
        $("#add-card-page").show();
    }
}

function createCookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

var english = angular.module("english", ['ngRoute', 'angularUtils.directives.dirPagination']);

english.config(function ($routeProvider, $locationProvider, $httpProvider) {
    $routeProvider.when('/', {
        templateUrl: "training/index-content.html",
        controller: "IndexController"
    }).when('/training', {
        templateUrl: "training/training.html",
        controller: "TrainingPageController"
    }).when('/add-card', {
        templateUrl: "training/add-card.html",
        controller: "AddCardController"
    }).when('/category/:id', {
        templateUrl: "training/category.html",
        controller: "CategoryController"
    }).when('/login', {
        templateUrl: "login.html"
    }).otherwise({
        templateUrl: 'training/empty.html'
    });

    // $locationProvider.html5Mode({enabled: true, requireBase: false});
});

english.controller('IndexController', function ($scope, $http, $location, $route, $routeParams) {

});

english.controller("TrainingPageController", function ($scope, $http, $window) {
    doGet($http, base_url + "/category/categories", function (data) {
        $scope.categories = data;
        $scope.imageUrl = image_url;
    });
});

english.controller("AddCardController", function ($scope, $http, $location, $route, $routeParams) {
    doGet($http, base_url + "/category/categories", function (data) {
        $scope.categories = data;
    });

    doGet($http, base_url + "/part-of-speech/parts-of-speech", function (data) {
        $scope.parts = data;
    });
});

english.controller("CategoryController", function ($scope, $http, $routeParams) {
    doGet($http, base_url + "/word/words-by-category/" + $routeParams.id, function (data) {
        $scope.words = data.wordsByCategory;
        $scope.imageUrl = image_url;
    });
});

function doGet($http, url, action, error) {
    doHttp("GET", $http, url, null, action, error);
}

function doPost($http, url, data, action, error) {
    doHttp("POST", $http, url, data, action, error);
}

function doHttp(method, $http, url, data, action, error) {
    var token = readCookie("token");
    var headers = {};
    if (token != null && token != "") {
        headers = {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };
    }
    $http({
        method: method,
        url: url,
        data: data,
        headers: headers
    }).then(function successCallback(response) {
        action(response.data);
    }, function errorCallback(response) {
        if (error) {
            error(response)
        } else {
            console.log("ERROR: ", response);
        }
    });
}