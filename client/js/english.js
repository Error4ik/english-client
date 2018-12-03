DOMAIN = 'http://78.107.253.241';
base_url = DOMAIN + ':9000';
image_url = base_url + "/image/";

user = {};
user.hasRole = function (role) {
    return false;
};

formIsValidate = true;

function login() {
    let email = $("#email").val();
    let pass = $("#password").val();
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
    let email = $("#reg-email").val();
    let pass = $("#reg-password").val();
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
    let token = readCookie("token");
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
    let form = $("#add-card").serializeArray();
    let file = $('input[type=file]')[0].files[0];
    let wordForm = checkFields(form, file);
    if (formIsValidate) {
        $.ajax({
            url: base_url + "/admin/add-card",
            method: "POST",
            contentType: false,
            data: wordForm,
            processData: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + readCookie("token"));
            },
            success: function () {
                document.location.href = "#!/";
            },
            error: function (error) {
                console.log("ERROR: ", error);
            }
        });
    }
}

function addCategory() {
    let form = $("#add-category").serializeArray();
    let file = $('input[type=file]')[0].files[0];
    let categoryForm = checkFields(form, file);
    if (formIsValidate) {
        $.ajax({
            url: base_url + "/admin/add-category",
            method: "POST",
            contentType: false,
            data: categoryForm,
            processData: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + readCookie("token"));
            },
            success: function () {
                document.location.href = "#!/";
            },
            error: function (error) {
                console.log("ERROR: ", error);
            }
        });
    }
}

function checkFields(form, file) {
    let formData = new FormData();
    formIsValidate = true;
    if (file === undefined) {
        formIsValidate = false;
    } else {
        formData.append("photo", file);
        for (let i = 0; i < form.length; ++i) {
            if (form[i].value === "") {
                formIsValidate = false;
                break;
            }
            formData.append(form[i].name, form[i].value);
        }
    }
    return formData;
}

function isAdmin() {
    return user.hasRole("admin");
}

function closeDialog(data) {
    $('#user-item').show();
    $('#login-page').hide();
    $('#user-info').html(data.name);
    if (isAdmin()) {
        $("#add-card-page").show();
        $("#add-category-page").show();
    }
}

function createCookie(name, value, days) {
    let expires;
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function readCookie(name) {
    let nameEQ = encodeURIComponent(name) + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

function innerDate() {
    let d = new Date();
    let day=["Воскресенье","Понедельник","Вторник", "Среда","Четверг","Пятница","Суббота"];
    let month=["января","февраля","марта","апреля","мая","июня", "июля","августа","сентября","октября","ноября","декабря"];

    document.getElementById("current-date").innerHTML = day[d.getDay()] + " " + d.getDate() + " " + month[d.getMonth()]
        + " " + d.getFullYear() + " г.";
}

let english = angular.module("english", ['ngRoute', 'angularUtils.directives.dirPagination']);

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
    }).when("/add-category", {
        templateUrl: "training/add-category.html"
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
    let token = readCookie("token");
    let headers = {};
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
