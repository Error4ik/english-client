DOMAIN = 'http://78.107.253.241';
// DOMAIN = 'http://localhost';
auth_url = DOMAIN + ':9000';
word_url = DOMAIN + ':9900';
noun_url = DOMAIN + ':9920';
sentence_url = DOMAIN + ':9910';
image_url = noun_url + "/image/";

user = {};
user.hasRole = function (role) {
    return false;
};

formIsValidate = false;

function login() {
    let email = $("#email").val();
    let pass = $("#password").val();
    if (email !== undefined && pass !== undefined && email !== "" && pass !== "") {
        $.ajax({
            url: auth_url + "/oauth/token",
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
                location.reload();
            },
            error: function (error) {
                let result = JSON.parse(error.responseText);
                if (result.error) {
                    $('#login_error').html(result.error == 'invalid_grant' ? "Логин или пароль не совпадают." : result.error_description);
                    $('#login_error').show();
                }
            }
        });
    }
}

function regUser() {
    let email = $("#reg-email").val();
    let pass = $("#reg-password").val();
    if (email !== undefined && pass !== undefined && email !== "" && pass !== "") {
        console.log("sending");
        $.ajax({
            url: auth_url + "/registration",
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
                    document.location.href = "#!/registration-is-completed";
                }
            },
            error: function (error) {
                console.log("ERROR: ", error);
            }
        });
    }
}

function loadUser(f) {
    let token = readCookie("token");
    if (token != null && token != "") {
        $.ajax({
            url: auth_url + '/user/current',
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
    $.ajax({
        url: auth_url + "/revoke",
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

function checkFields(form) {
    let formData = new FormData();
    formIsValidate = true;
    for (let i = 0; i < form.length; ++i) {
        if (form[i].value === "") {
            formIsValidate = false;
            break;
        }
        formData.append(form[i].name, form[i].value);
    }
    return formData;
}

function isAdmin() {
    return user.hasRole("admin");
}

function isAuthenticated() {
    return user.authenticated;
}

function closeDialog(data) {
    $('#user-item').show();
    $('#login-page').hide();
    $('#user-info').html(data.name);
    if (isAuthenticated()) {
        $("#user-panel").show();
        $("#user-practice").show();
    }
    if (isAdmin()) {
        $("#admin-panel").show();
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
    let day = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    let month = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

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
        controller: "TrainingController"
    }).when('/category', {
        templateUrl: "training/category.html",
        controller: "CategoryController"
    }).when('/add-card', {
        templateUrl: "training/add-card.html",
        controller: "AddCardController"
    }).when('/add-category', {
        templateUrl: "training/add-category.html",
        controller: "AddCategoryController"
    }).when('/category/:id', {
        templateUrl: "training/nouns-by-category.html",
        controller: "NounByCategoryController"
    }).when('/login', {
        templateUrl: "login.html"
    }).when('/registration-is-completed', {
        templateUrl: "training/registration-is-completed.html"
    }).when('/practice', {
        templateUrl: "training/practice.html",
        controller: "PracticeController"
    }).when('/noun-exam/:id', {
        templateUrl: "training/noun-exam-page.html",
        controller: "NounExamController"
    }).when('/word-exam/:id', {
        templateUrl: "training/word-exam-page.html",
        controller: "WordExamController"
    }).when('/sentence-exam/:id', {
        templateUrl: "training/sentence-exam-page.html",
        controller: "SentenceExamController"
    }).when('/result', {
        templateUrl: "training/exam-result.html",
        controller: "ExamResultController"
    }).when('/add-noun-question', {
        templateUrl: "training/add-noun-questions.html",
        controller: "AddNounQuestionsController"
    }).when('/add-word-question', {
        templateUrl: "training/add-word-question.html",
        controller: "AddWordQuestionController"
    }).when('/learning-by-part-of-speech', {
        templateUrl: "training/parts-of-speech.html",
        controller: "PartOfSpeechController"
    }).when('/words-by-part-of-speech/:id', {
        templateUrl: "training/words-by-part-of-speech.html",
        controller: "WordsByPartOfSpeechController"
    }).when('/learning-by-sentence', {
        templateUrl: "training/sentence-category.html",
        controller: "SentenceCategoryController"
    }).when('/sentence-by-category/:id', {
        templateUrl: "training/sentence-by-category.html",
        controller: "SentenceByCategoryController"
    }).when('/add-sentence', {
        templateUrl: "training/add-sentence.html",
        controller: "AddSentenceCategoryController"
    }).when('/add-sentence-question', {
        templateUrl: "training/add-sentence-question.html",
        controller: "AddSentenceQuestionController"
    }).when('/users', {
        templateUrl: "training/users.html",
        controller: "UserController"
    }).when('/change-delete-card', {
        templateUrl: "training/all-cards.html",
        controller: "AllCardsController"
    }).otherwise({
        templateUrl: 'training/empty.html'
    });

    // $locationProvider.html5Mode({enabled: true, requireBase: false});
});

english.controller('IndexController', function ($scope, $http, $location, $route, $routeParams) {

});

english.controller("TrainingController", function ($scope, $http, $location, $route, $routeParams) {
    console.log("Training controller!");
});

english.controller("CategoryController", function ($scope, $http) {
    doGet($http, noun_url + "/category/categories", function (data) {
        $scope.categories = data;
        $scope.imageUrl = image_url;
    });
});

english.controller("AddCardController", function ($scope, $http) {
    doGet($http, noun_url + "/category/categories", function (data) {
        $scope.categories = data;
    });

    doGet($http, word_url + "/part-of-speech/parts-of-speech", function (data) {
        $scope.parts = data;
    });

    $scope.addNoun = function addNoun() {
        let form = $("#add-noun").serializeArray();
        let file = $('input[type=file]')[0].files[0];
        if (typeof file !== "undefined") {
            let nounForm = checkFields(form);
            nounForm.append("photo", file);
            if (formIsValidate) {
                let url = noun_url + "/noun/add-noun";
                save(url, nounForm);
            }
        }
    };

    $scope.addWord = function addWord() {
        let form = $("#add-word").serializeArray();
        let wordForm = checkFields(form);
        if (formIsValidate) {
            let url = word_url + "/word/add-word";
            save(url, wordForm);
        }
    };
});

english.controller("AddCategoryController", function ($scope, $http) {
    $scope.addCategory = function addCategory() {
        let form = $("#add-category").serializeArray();
        let file = $('input[type=file]')[0].files[0];
        if (typeof file !== "undefined") {
            let categoryForm = checkFields(form);
            categoryForm.append("photo", file);
            if (formIsValidate) {
                let url = noun_url + "/category/add-category";
                save(url, categoryForm);
            }
        }
    }
});

english.controller("NounByCategoryController", function ($scope, $http, $routeParams) {
    let page = 0;
    $scope.itemsPerPage = 12;
    $scope.total_count = 0;
    $scope.nouns = [];
    $scope.getData = function (page) {
        if (page > 0) {
            page = page - 1;
        }
        let url = noun_url + "/noun/nouns/by/category/" + $routeParams.id + "/" + $scope.itemsPerPage + "/" + page;
        doGet($http, url, function (data) {
            $scope.nouns = data.nouns;
            $scope.total_count = data.allRecords;
            $scope.imageUrl = image_url;
            $scope.category = data.nouns[0].category.name;
        });
    };

    $scope.getData(page);
});

english.controller("PracticeController", function ($scope, $http) {
    doGet($http, noun_url + "/exam/exams", function (data) {
        $scope.nounExams = data;
    });

    doGet($http, word_url + "/exam/exams", function (data) {
        $scope.wordExams = data;
    });

    doGet($http, sentence_url + "/exam/exams", function (data) {
        $scope.sentenceExams = data;
    });
});

english.controller("NounExamController", function ($scope, $http, $routeParams) {
    let questions;
    let count = 0;
    let answersTrue = [];
    let userAnswers = [];
    let totalQuestion;
    let examId;
    doGet($http, noun_url + "/exam/" + $routeParams.id, function (data) {
        if (data.type === 0) {
            $scope.exam1 = true;
        } else {
            $scope.exam2 = true;
        }
        $scope.imageUrl = image_url;
        $scope.name = data.name;
        examId = data.id;
        questions = data.questions;
        $scope.noun = questions[count].noun;
        $scope.variants = questions[count].nouns;
        totalQuestion = questions.length;
        $scope.count = count + 1;
        $scope.total = totalQuestion;
        $scope.progress = ($scope.count / totalQuestion) * 100;
    });

    $scope.next = function (noun, variant) {
        answersTrue.push(noun);
        userAnswers.push(variant);

        if (count >= 0 && count < questions.length - 1) {
            $scope.noun = questions[++count].noun;
            $scope.variants = questions[count].nouns;
            $scope.count = count + 1;
            $scope.progress = ($scope.count / totalQuestion) * 100;
        } else {
            let coincidences = 0;
            for (let i = 0; i < questions.length; i++) {
                if (answersTrue[i].noun === userAnswers[i].noun) {
                    coincidences += 1;
                }
            }

            $.ajax({
                url: noun_url + '/exam/save-stats-for-exam',
                type: 'POST',
                dataType: "json",
                crossDomain: true,
                data: {"examId": examId, "correctAnswer": coincidences},
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + readCookie("token"));
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
                },
                success: function (data) {
                    document.location.href = "#!/result";
                },
                error: function (data) {
                    console.log(JSON.parse(data.responseText).error_description);
                }
            });
        }
    };
});

english.controller("WordExamController", function ($scope, $http, $routeParams) {
    let questions;
    let count = 0;
    let answersTrue = [];
    let userAnswers = [];
    let totalQuestion;
    let examId;
    doGet($http, word_url + "/exam/" + $routeParams.id, function (data) {
        $scope.exam = true;
        $scope.name = data.name;
        examId = data.id;
        questions = data.questions;
        $scope.word = questions[count].word;
        $scope.variants = questions[count].words;
        totalQuestion = questions.length;
        $scope.count = count + 1;
        $scope.total = totalQuestion;
        $scope.progress = ($scope.count / totalQuestion) * 100;
    });

    $scope.next = function (word, variant) {
        answersTrue.push(word);
        userAnswers.push(variant);

        if (count >= 0 && count < questions.length - 1) {
            $scope.word = questions[++count].word;
            $scope.variants = questions[count].words;
            $scope.count = count + 1;
            $scope.progress = ($scope.count / totalQuestion) * 100;
        } else {
            let coincidences = 0;
            for (let i = 0; i < questions.length; i++) {
                if (answersTrue[i].word === userAnswers[i].word) {
                    coincidences += 1;
                }
            }

            $.ajax({
                url: word_url + '/exam/save-stats-for-exam',
                type: 'POST',
                dataType: "json",
                crossDomain: true,
                data: {"examId": examId, "correctAnswer": coincidences},
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + readCookie("token"));
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
                },
                success: function (data) {
                    document.location.href = "#!/result";
                },
                error: function (data) {
                    console.log(JSON.parse(data.responseText).error_description);
                }
            });
        }
    };
});

english.controller("SentenceExamController", function ($http, $scope, $routeParams) {
    let questions = [];
    let count = 0;
    let totalQuestion;
    let examId;
    let coincidences = 0;
    doGet($http, sentence_url + "/exam/" + $routeParams.id, function (data) {
        $scope.exam = true;
        $scope.exam = data;
        $scope.name = data.name;
        questions = data.questions;
        totalQuestion = questions.length;
        examId = data.id;
        $scope.question = questions[count];
        $scope.count = count + 1;
        $scope.total = totalQuestion;
        $scope.progress = ($scope.count / totalQuestion) * 100;
    });

    $scope.next = function () {
        let value = $("#translate");
        if (questions[count].answer === value.val()) {
            coincidences += 1;
        }

        if (count >= 0 && count < questions.length - 1) {
            $scope.question = questions[++count];
            $scope.count = count + 1;
            $scope.progress = ($scope.count / totalQuestion) * 100;
            value.val('');
        } else {
            $.ajax({
                url: sentence_url + '/exam/save-stats-for-exam',
                type: 'POST',
                dataType: "json",
                crossDomain: true,
                data: {"examId": examId, "correctAnswers": coincidences},
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + readCookie("token"));
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
                },
                success: function (data) {
                    document.location.href = "#!/result";
                },
                error: function (data) {
                    console.log(JSON.parse(data.responseText).error_description);
                }
            });
        }
    }
});

english.controller("ExamResultController", function ($scope, $http) {
    doGet($http, noun_url + "/exam/exam-stats-by-user", function (data) {
        $scope.nounExams = data;
    });

    doGet($http, word_url + "/exam/exam-stats-by-user", function (data) {
        $scope.wordExams = data;
    });

    doGet($http, sentence_url + "/exam/exam-stats-by-user", function (data) {
        $scope.sentenceExams = data;
    })
});

english.controller("AddNounQuestionsController", function ($scope, $http) {
    let exams = [];
    doGet($http, noun_url + "/exam/exams", function (data) {
        $scope.exams = data;
        exams = data;
    });

    doGet($http, noun_url + "/category/categories", function (data) {
        $scope.categories = data;
    });

    $scope.addExam = function () {
        let data = new FormData($("#add-exam")[0]);
        let url = noun_url + "/exam/add-exam";
        save(url, data);
    };

    $scope.changedValue = function (item) {
        for (let i = 0; i < exams.length; i++) {
            if (exams[i].name === item) {
                item = exams[i];
                break;
            }
        }
        $scope.setWords(item);
    };

    $scope.setWords = function (exam) {
        doGet($http, noun_url + "/noun/nouns/by/category/" + exam.category.id, function (data) {
            $scope.nouns = data;
            $scope.nounsIsNotQuestion = getNounsIsNotQuestion(data, exam);
        });
    };

    $scope.addQuestion = function () {
        let data = new FormData($("#add-question")[0]);
        let url = noun_url + "/exam/add-question";
        save(url, data);
    }
});

english.controller("AddWordQuestionController", function ($scope, $http) {
    let exams = [];
    let words = [];
    doGet($http, word_url + "/exam/exams", function (data) {
        $scope.exams = data;
        exams = data;
    });

    doGet($http, word_url + "/part-of-speech/parts-of-speech", function (data) {
        $scope.partsOfSpeech = data;
    });

    $scope.addExam = function () {
        let data = new FormData($("#add-word-exam")[0]);
        let url = word_url + "/exam/add-exam";
        save(url, data);
    };

    $scope.changeWord = function (item) {
        let variants = [];
        for (let i = 0; i < words.length; i++) {
            if (words[i].word !== item) {
                variants.push(words[i]);
            }
        }
        $scope.words = variants;
    };

    $scope.changeValue = function (item) {
        for (let i = 0; i < exams.length; i++) {
            if (exams[i].name === item) {
                item = exams[i];
                break;
            }
        }
        $scope.setWords(item);
    };

    $scope.setWords = function (exam) {
        doGet($http, word_url + "/word/words/by/part-of-speech/" + exam.partOfSpeech.id, function (data) {
            $scope.wordsIsNotQuestion = getWordsIsNotQuestion(data, exam);
        });

        doGet($http, word_url + "/word/words", function (data) {
            $scope.words = data;
            words = data;
        });
    };

    $scope.addQuestion = function () {
        let data = new FormData($("#add-word-question")[0]);
        let url = word_url + "/exam/add-question";
        save(url, data);
    }
});

english.controller("PartOfSpeechController", function ($scope, $http) {
    doGet($http, word_url + "/part-of-speech/parts-of-speech", function (data) {
        $scope.parts = data;
    })
});

english.controller("WordsByPartOfSpeechController", function ($scope, $http, $routeParams) {
    let page = 0;
    $scope.itemsPerPage = 12;
    $scope.total_count = 0;
    $scope.words = [];
    $scope.getData = function (page) {
        if (page > 0) {
            page = page - 1;
        }
        let url = word_url + "/word/words/by/part-of-speech/" + $routeParams.id + "/" + $scope.itemsPerPage + "/" + page;
        doGet($http, url, function (data) {
            $scope.words = data.wordsByPartOfSpeech;
            $scope.total_count = data.allRecords;
            $scope.partOfSpeech = data.wordsByPartOfSpeech[0].partOfSpeech.name;
            $scope.description = data.wordsByPartOfSpeech[0].partOfSpeech.description;
        });
    };

    $scope.getData(page);
});

english.controller("SentenceCategoryController", function ($scope, $http, $routeParams) {
    doGet($http, sentence_url + "/category/categories", function (data) {
        $scope.categories = data;
    })
});

english.controller("SentenceByCategoryController", function ($scope, $http, $routeParams) {
    let page = 0;
    $scope.itemsPerPage = 12;
    $scope.total_count = 0;
    $scope.sentences = [];
    $scope.getData = function (page) {
        if (page > 0) {
            page = page - 1;
        }
        let url = sentence_url + "/sentence/category/" + $routeParams.id + "/" + $scope.itemsPerPage + "/" + page;
        doGet($http, url, function (data) {
            $scope.sentences = data.sentencesByCategoryId;
            $scope.total_count = data.allRecords;
            $scope.category = data.sentencesByCategoryId[0].category.name;
            $scope.description = data.sentencesByCategoryId[0].category.description;
        });
    };

    $scope.getData(page);
});

english.controller("AddSentenceCategoryController", function ($scope, $http, $routeParams) {
    doGet($http, sentence_url + "/category/categories", function (data) {
        $scope.categories = data;
    });

    $scope.addSentence = function () {
        let form = $("#add-sentence").serializeArray();
        let data = checkFields(form);
        if (formIsValidate) {
            let url = sentence_url + "/sentence/add-sentence";
            save(url, data);
        }
    }
});

english.controller("AddSentenceQuestionController", function ($scope, $http) {
    let exams = [];
    let examId;
    $scope.addExam = function () {
        let data = new FormData($("#add-sentence-exam")[0]);
        let url = sentence_url + "/exam/add-exam";
        save(url, data)
    };

    $scope.addKeyWord = function () {
        let data = new FormData($("#add-key-word")[0]);
        let url = sentence_url + "/key-word/add";
        save(url, data);
    };

    doGet($http, sentence_url + "/exam/exams", function (data) {
        $scope.exams = data;
        exams = data;
    });

    doGet($http, sentence_url + "/key-word/words", function (data) {
        $scope.keyWords = data;
    });

    $scope.changedValue = function (exam) {
        for (let i = 0; i < exams.length; i++) {
            if (exams[i].name === exam) {
                examId = exams[i].id;
                break;
            }
        }
    };

    $scope.addQuestion = function () {
        let data = new FormData($("#sentence-question")[0]);
        data.append("examId", examId);
        let url = sentence_url + "/exam/add-question";
        save(url, data);
    };
});

english.controller("UserController", function ($scope, $http) {
    doGet($http, auth_url + "/users", function (data) {
        $scope.users = data;
    });

    let allRoles = [];

    doGet($http, auth_url + "/roles", function (data) {
        $scope.roles = data;
        allRoles = data;
    });

    $scope.userRoles = function (userRoles) {
        let array = [];
        if (allRoles.length === userRoles.length) {
            return array
        }
        if (userRoles.length === 0) {
            array = allRoles;
        }
        for (let a = 0; a < allRoles.length; a++) {
            for (let b = 0; b < userRoles.length; b++) {
                if (allRoles[a].role === userRoles[b].role) {
                    break;
                } else {
                    array.push(allRoles[a]);
                }
            }
        }
        return array;
    };

    $scope.addOrDeleteRole = function (user, role) {
        $.ajax({
            url: auth_url + "/change-role",
            method: "POST",
            dataType: "json",
            data: {"userId": user.id, "roleId": role.id},
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + readCookie("token"));
            },
            success: function (data) {
                location.reload();
            },
            error: function (error) {
                console.log(error);
            }
        });
    }
});

english.controller("AllCardsController", function ($scope, $http, $routeParams) {
    doGet($http, word_url + "/word/words", function (data) {
        $scope.words = data;
    });

    doGet($http, noun_url + "/noun/nouns", function (data) {
        $scope.nouns = data;
    });

    $scope.deleteWord = function (id) {
        if (confirm("Are you sure to delete this word ?")) {
            let url = word_url + "/word/delete-word";
            deleteWordOrNoun(url, id);
        }
    };

    $scope.deleteNoun = function (id) {
        if (confirm("Are you sure to delete this noun ?")) {
            let url = noun_url + "/noun/delete-noun";
            deleteWordOrNoun(url, id);
        }
    };

    function deleteWordOrNoun(url, id) {
        $.ajax({
            url: url,
            method: "DELETE",
            dataType: "json",
            data: {"id": id},
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + readCookie("token"));
            },
            success: function () {
                location.reload();
            },
            error: function (error) {
                console.log("ERROR ", error);
                location.reload();
            }
        })
    }

    $scope.editWord = function () {
        doGet($http, word_url + "/part-of-speech/parts-of-speech", function (data) {
            $scope.parts = data;
        });
    };

    $scope.editNoun = function () {
        doGet($http, noun_url + "/category/categories", function (data) {
            $scope.categories = data;
        });
    };

    $scope.saveWord = function (id, index) {
        let form = $("#edit-word" + index).serializeArray();
        let wordForm = checkFields(form);
        wordForm.append("wordId", id);
        if (formIsValidate) {
            let url = word_url + "/word/edit-word";
            save(url, wordForm);
            form = null;
            wordForm = null;
        }
    };

    $scope.saveNoun = function (id, index) {
        let form = $("#edit-noun" + index).serializeArray();
        let file = $('input[type=file]')[index].files[0];
        let nounForm = checkFields(form);
        nounForm.append("nounId", id);
        if (typeof file !== "undefined") {
            nounForm.append("photo", file);
        }
        if (formIsValidate) {
            let url = noun_url + "/noun/edit-noun";
            save(url, nounForm);
            form = null;
            file = null;
            nounForm = null;
        }
    };

    $scope.getTranslation = function (list) {
        let result = "";
        for (let i = 0; i < list.length; i++) {
            result += list[i].translation.trim() + (i === list.length - 1 ? '' : ', ');
        }
        return result;
    }
});

function save(url, data) {
    $.ajax({
        url: url,
        method: "POST",
        contentType: false,
        data: data,
        processData: false,
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + readCookie("token"));
        },
        success: function () {
            location.reload();
        },
        error: function (error) {
            console.log("ERROR: ", error);
            console.log(JSON.parse(error.responseText).error_description)
        }
    });
}

function modalLoginForm() {
    $('#login-form-link').click(function (e) {
        $("#login-form").delay(100).fadeIn(100);
        $("#registration").fadeOut(100);
        $('#register-form-link').removeClass('active');
        $(this).addClass('active');
        e.preventDefault();
    });
    $('#register-form-link').click(function (e) {
        $("#registration").delay(100).fadeIn(100);
        $("#login-form").fadeOut(100);
        $('#login-form-link').removeClass('active');
        $(this).addClass('active');
        e.preventDefault();
    });
}

function getNounsIsNotQuestion(nouns, exam) {
    let array = [];
    let flag = true;
    if (exam.questions.length > 0) {
        for (let i = 0; i < nouns.length; i++) {
            for (let j = 0; j < exam.questions.length; j++) {
                if (nouns[i].id === exam.questions[j].noun.id) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                array.push(nouns[i]);
            }
            flag = true;
        }
    } else {
        array = nouns;
    }
    return array;
}

function getWordsIsNotQuestion(words, exam) {
    let array = [];
    let flag = true;
    if (exam.questions.length > 0) {
        for (let i = 0; i < words.length; i++) {
            for (let j = 0; j < exam.questions.length; j++) {
                if (words[i].id === exam.questions[j].word.id) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                array.push(words[i]);
            }
            flag = true;
        }
    } else {
        array = words;
    }
    return array;
}

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
            if (response.data.error === "unauthorized") {
                console.log("You are not logged in, please log in.")
            }
            console.log("ERROR: ", response);
        }
    });
}
