/**
 * jQuery 기반 퀴즈 엔진
 * ====================
 * @author soma0sd <soma0sd@gmail.com>
 * @param {String} quiz_url - js file path or url
 * @param options
 */
(function($){
  $.fn.s0QuizLoad = function(quiz_url, options){
    var settings = $.extend({
      selector: {
        title: '#title',
        desc: '#desc',
        canvas: '#result',
        nav: '#nav',
      },
      view: {
        width: 1200,
        height: 600,
      },
      color: {
        bar: ['#C62828', '#6A1B9A', '#303F9F', '#D81B60'],
        info: '#00897B',
      },
      quiz: {
        label: [
          'thumb_down',
          '',
          'thumbs_up_down',
          '',
          'thumb_up'
        ],
        nav: {
          prev: 'keyboard_arrow_left',
          next: 'keyboard_arrow_right',
          result: '결과 확인',
          fbs: '공유'
        },
        checked: 'done_outline',
        json_key: {
          values: "values",
          contents: "contents",
        },
      },
      facebook: {
        appID: '1982488155103997',
        version: 'v3.0',
      }
    }, options);
    // jQuery Dom
    var $view     = $(this);
    var $title    = $(settings.selector.title);
    var $desc     = $(settings.selector.desc);
    var $result   = $(settings.selector.canvas);
    var $selector = $(init_quiz_selector()).appendTo(this);

    var _$navElems = init_nav_wrap();
    var $nav = $(_$navElems.wrap).appendTo(settings.selector.nav);
    var $navBtns  = {
      prev: $(_$navElems.btns.prev),
      next: $(_$navElems.btns.next),
      result: $(_$navElems.btns.result),
      fbs: $(_$navElems.btns.fbs)
    };

    // quiz variables
    var quizLim;
    var quizIndex;
    var pageLim;
    var pageIndex;
    var quizUserSelect;
    var quizUserValues;
    var quizSelectRatio = [-1, -0.5, 0, 0.5, 1];
    var quizValues;
    var quizContents;
    var isUserSelected = false;
    // set canvas variables
    var canvas = $result[0].getContext('2d');
    // set bar variables
    var barVstart  = 0;
    var barVend    = settings.view.height * 0.9;
    var barVMargin = 20;
    var barHStart = settings.view.width * 0.01;
    var barHEnd   = settings.view.width * 0.99;
    var barColorArr = settings.color.bar;
    // info box variables
    var infoBoxHeight = settings.view.height * 0.2;
    var infoBoxVStart = settings.view.height * 0.9;

    var resultDataURL;

    // main init
    $selector.hide();
    $result.hide();
    $nav.hide();
    $.getJSON(quiz_url, function(data){
      quizValues = data[settings.quiz.json_key.values];
      quizContents = data[settings.quiz.json_key.contents];
      main();
    })
    .fail(function(request,status,error){
      console.log( "code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
    });

    // main function
    function main(){
      let urlParam = window.location.search.substring(1).split('&');
      if(urlParam && urlParam[0] == "result"){
        result(urlParam);
      } else {
        init_quiz_show();
      }
    }

    // fuctions
    function init_quiz_show(){
      pageIndex = 0;
      pageLim = quizContents.length;

      quizIndex = 0;
      quizLim = 0;
      $.each(quizContents, function(i,v){
        if(v.score){quizLim++}
      });

      quizUserSelect = {};
      show_quiz_page();
    }
    function init_quiz_selector(){
      let $wrap = $('<div id="s0-quiz-selector-wrap"></div>');
      let labelText = settings.quiz.label;
      for (var i = 0; i < 5; i++) {
        let $input = $('<input class="s0-radio" id="s0-radio-' + (i+1) + '" type="radio" value="' + i + '" name="s0-quiz-selector">');
        let $label = $('<label class="s0-label" for="s0-radio-' + (i+1) + '">' + labelText[i] + '</label>');
        $wrap.append($input);
        $wrap.append($label);
      }
      return $wrap;
    }
    function init_nav_wrap(){
      let $wrap   = $('<div id="s0-quiz-nav-wrap"></div>');
      let $button = {
        prev: $('<button id="s0-quiz-nav-prev">' + settings.quiz.nav.prev + '</button>'),
        next: $('<button id="s0-quiz-nav-next">' + settings.quiz.nav.next + '</button>'),
        result: $('<button id="s0-quiz-nav-result">' + settings.quiz.nav.result + '</button>'),
        fbs: $('<button id="s0-quiz-nav-facebook">' + settings.quiz.nav.fbs + '</button>')
      };
      $wrap.append($button.prev);
      $wrap.append($button.next);
      $wrap.append($button.result);
      $wrap.append($button.fbs);
      return {
        wrap: $wrap,
        btns: {
          prev: $button.prev,
          next: $button.next,
          result: $button.result,
          fbs: $button.fbs
        }
      };
    }

    function show_quiz_page() {
      let contents = quizContents[pageIndex];

      if(contents.title){$title.html(contents.title)}
      else{$title.html('문제: '+ quizIndex + ' / ' + quizLim)}

      if(contents.score){$selector.show()}
      else{$selector.hide()}
      $('.s0-radio:checked').prop("checked",false);

      if(contents.desc){$desc.html(contents.desc)}

      if(pageIndex == 0){$navBtns.prev.hide()}
      else{$navBtns.prev.show()}

      if(pageIndex == pageLim-1){$navBtns.next.hide()}
      else{$navBtns.next.show()}

      if(pageIndex == pageLim-1){$navBtns.result.show()}
      else{$navBtns.result.hide()}
      $nav.show();
    }

    function result(urlParam){
      quizUserSelect = {};
      quizUserValues = {};
      $title.hide();
      $.each(urlParam, function(){
        let item = this.split('=');
        if(item.length > 1){
          quizUserSelect[item[0]] = item[1];
        }
      });
      $.each(quizValues, function(key, val){
        quizUserValues[key] = {
          point: 0,
          name: val,
          percent: 0,
          ratio: 0,
          lim: 0
        };
      });
      let ratioMax = quizSelectRatio[4];
      $.each(quizUserSelect, function(key, val){
        let values = quizContents[key].score;
        let ratio  = quizSelectRatio[parseInt(val)];
        $.each(values, function(name, point){
          let nowPoint = parseFloat(point);
          quizUserValues[name].lim += Math.abs(ratioMax * nowPoint);
          quizUserValues[name].point += ratio * nowPoint;
        });
      });

      $result.attr('width', settings.view.width);
      $result.attr('height', settings.view.height);
      canvas.clearRect(0, 0, settings.view.width, settings.view.height);
      let barIndex = 0;
      $.each(quizUserValues, function(key, val){
        let values = quizUserValues[key];
        values.percent = (100 * (val.lim + val.point) / (val.lim * 2)).toFixed(1)+"%";
        values.ratio = (val.lim + val.point) / (val.lim * 2);
        _draw_bar(barIndex, values);
        barIndex++;
      });
      resultDataURL = $result[0].toDataURL();
      let $img = $('<img id="result-img">');
      $img.attr('src',resultDataURL);
      $view.append($img);
      $navBtns.next.hide();
      $navBtns.prev.hide();
      $navBtns.result.hide();
      $nav.show();
    }

    function _draw_bar(index, values){
      let Height  = (barVend - barVstart - infoBoxHeight- barVMargin) / Object.keys(quizValues).length;
      let x0 = barHStart;
      let y0 = barVMargin + index * (Height + barVMargin);
      let dx = barHEnd - barHStart;
      let dy = Height;
      let dr = dy / 2;
      let px = dx * values.ratio;
      let fontSize = dr;
      canvas.save();
      canvas.beginPath();
      canvas.moveTo(x0 + dr ,y0);
      canvas.lineTo(x0 + dx - dr, y0);
      canvas.quadraticCurveTo(x0+dx, y0, x0+dx, y0+dr);
      canvas.quadraticCurveTo(x0+dx, y0+dy, x0+dx-dr, y0+dy);
      canvas.lineTo(x0 + dx - dr, y0+dy);
      canvas.lineTo(x0 + dr, y0+dy);
      canvas.quadraticCurveTo(x0, y0+dy, x0, y0+dr);
      canvas.quadraticCurveTo(x0, y0, x0+dr, y0);
      canvas.fill();
      canvas.clip();
      canvas.fillStyle = "#111111";
      canvas.fillRect(x0, y0, dx, dy);
      canvas.fillStyle = barColorArr[index % barColorArr.length];
      canvas.fillRect(x0, y0, px, dy);
      canvas.font = 'bold '+fontSize+'px "Gothic A1"';
      canvas.fillStyle = "#FAFAFA";
      canvas.textAlign = 'left';
      canvas.fillText(values.name, x0+dr, y0+dy-(fontSize/5));
      canvas.textAlign = 'right';
      canvas.font = 'bold '+(fontSize*0.7)+'px "Gothic A1"';
      canvas.fillText(values.percent, x0+(dx*0.98), y0+(dy/2)+(fontSize*0.35));
      canvas.restore();
    }

    // events
    $($selector.find('.s0-radio')).click(function(){
      isUserSelected = true;
      quizUserSelect[pageIndex] = this.value;
    });
    $navBtns.prev.click(function(){
      if(!quizContents[pageIndex].score || isUserSelected){
        if(quizContents[pageIndex].score){quizIndex--}
        pageIndex--;
        show_quiz_page();
      }
    });
    $navBtns.next.click(function(){
      if(!quizContents[pageIndex].score || isUserSelected){
        pageIndex++;
        if(quizContents[pageIndex].score){quizIndex++}
        show_quiz_page();
      }
    });
    $navBtns.result.click(function(){
      if(!quizContents[pageIndex].score || isUserSelected){
        let baseurl = $(location).attr('href');
        let param = "?result";
        $.each(quizUserSelect, function(k, v){
          param += "&" + k + "=" + v;
        });
        window.location.href = baseurl + param;
      }
    });
    $navBtns.fbs.click(function(){
      let msg = '';
      $.each(quizUserValues, function(key, val){
        msg += val.name + "\n";
      });
      console.log(window.location.href);
      FB.ui({
        method: 'share',
        name: '자유사상 가치척도',
        display: 'popup',
        hashtag: '#Freethink_N',
        quote: msg,
        // description: msg,
        href: 'https://freethinkers-kr.github.io/Values-of-Freethought/\?' + window.location.search.substring(1)
      }, function(response){console.log(response)});
    });
  }
}(jQuery));
