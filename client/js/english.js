DOMAIN = 'http://192.168.1.168';
base_url = DOMAIN + ':8080';

function doGet($http, url, action, error) {
    doHttp("GET", $http, url, null, action, error);
}

function doPost($http, url, data, action, error) {
    doHttp("POST", $http, url, data, action, error);
}

function doHttp(method, $http, url, data, action, error) {
    $http({
        method: method,
        url: url,
        data: data
    }).then(function successCallback(response) {
        action(response.data);
    }, function errorCallback(response) {
        if (error) {
            error(response)
        } else {
            console.log(response);
        }
    });
}

function loadPage(url, anchor) {
    var current = window.location.href;
    if (current.indexOf('#') !== -1) {
        current = current.substr(0, current.indexOf('#'));
    }
    if (!current.indexOf("redirectUri") && current.endsWith(url)) {
        location.hash = anchor;
    } else {
        document.location.href = CONTEXT + url + anchor;
    }
    return false;
}

function initHeader() {
    $("#header-logo").attr("src", CONTEXT + "img/header-english-logo.png");
}

function initFooter() {
    $("#footer-logo").attr("src", CONTEXT + "img/footer-english-logo.png");
}

//
// $(document).ready(function () {
//     console.log("Hello! ped");
//     $.ajax({
//         url: base_url + "/users",
//         method: "GET",
//         success: function (data) {
//             console.log(data);
//         },
//         error: function (error) {
//             console.log("ERROR ", error)
//         }
//     })
// });