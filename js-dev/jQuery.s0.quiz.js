(function($){
  $.fn.S0Quiz = function(json_url, options){
    var opt = $.extend({
      id: {
        wrapper: '#s0-quiz-warp',

        content: '#s0-quiz-contents-warp',
        title:   '#s0-quiz-title',
        desc:    '#s0-quiz-desc',
        radio:   '#s0-quiz-radio',

        navbar:    '#s0-quiz-nav',
        navNext:   '#s0-quiz-nav-next',
        navPrev:   '#s0-quiz-nav-prev',
        navResult: '#s0-quiz-nav-result',
        navReturn: '#s0-quiz-nav-return',
        shareFB:   '#s0-quiz-share-fb',

        canvas: '#s0-quiz-result-canvas',
      },
      facebook: {
        AppID: '2160017247578704',
        testAppID: '650644625328419',
      }
    }, options);

    // document variables
    var url = window.location;
    var $view = $(this);
    var isResult = false;
    var isDebug = false;
    var $container, $wrapper, $title, $desc, $radio, $nav, $navNext, $navPrev, $navResult, $canvas, $navReturn, $shareFB;

    // data variables
    var quizData;
    var quizContentsIndex;
    var quizLimIndex;
    var quizSelectData = {};

    // in quiz variables
    var isSelected;
    var isQuiz;
    var nowSelect;

    // in result variables
    var valuesData = {};
    var colors = ['#C62828', '#6A1B9A', '#303F9F', '#D81B60'];

    // result canvas variables
    var canvas = {width: 1600, height: 800};

    // facebook variables
    var appId;

    // main
    _load_json(json_url, function(data){
      let urlParam = url.search.substring(1);
      quizData = data;
      if(url.protocol == "file:" || url.hostname == 'localhost'){
        appID = opt.facebook.testAppID;
        isDebug = true;
        console.log('debug mode');
        console.log('@ URL data:');
        console.log(url);
        console.log('@ DB from ['+ json_url +']');
        console.log(quizData);
      } else {
        appID = opt.facebook.AppID;
      }
      if(urlParam.length > 0){
        isResult = true;
        init_result_data();
        init_result_layout();
        draw_result_canvas();
        init_result_events();
      } else {
        isResult = false;
        init_quiz_layout();
        init_quiz_events();
      }
    });

    // functions
    function init_quiz_layout(){
      let btnCls01 = '.s0-btn';
      let btnCls02 = '.s0-btn.s0-float.s0-nav';
      let btnCls03 = '.s0-btn.s0-float.s0-radio';
      let btnCls04 = '.s0-btn.s0-result';
      quizContentsIndex = 0;
      isSelected = false;
      $container = _create_element('div', opt.id.wrapper, $view);

      $wrapper = _create_element('div', opt.id.content, $container);
      $title   = _create_element('h1', opt.id.title, $wrapper);
      $desc    = _create_element('div', opt.id.desc, $wrapper);
      $radio   = _create_element('div', opt.id.radio, $wrapper);
      $radio.css('font-family', '"Material Icons"');
      for(let i=0; i < 5; i++){
        let nameID = opt.id.radio + "-item-" + i + btnCls03;
        let item = _create_element('a', nameID, $radio);
        switch (i) {
          case 0: item.html('thumb_down');break;
          case 2: item.html('thumbs_up_down');break;
          case 4: item.html('thumb_up');break;
        }
        item.attr('data', i);
      }

      $nav = _create_element('div', opt.id.navbar, $container);
      $navNext = _create_element('a', opt.id.navNext + btnCls02 + '.disable.next', $nav);
      $navPrev = _create_element('a', opt.id.navPrev + btnCls02 + '.prev', $nav);
      $navResult = _create_element('a', opt.id.navResult + btnCls04 + '.disable', $nav);
      $nav.css('font-family', '"Material Icons"');
      $navNext.html('keyboard_arrow_right');
      $navPrev.html('keyboard_arrow_left');
      $navResult.html('done_outline 결과 보기');

      set_quiz_contents();
    }
    function init_quiz_events(){
      $navNext.click(function(){
        if(isSelected || !isQuiz){
          quizContentsIndex++; set_quiz_contents();
        }
      });
      $navPrev.click(function(){
        quizContentsIndex--; set_quiz_contents();
      });
      $('.s0-btn.s0-radio').click(function(){
        isSelected = true;
        quizSelectData[quizContentsIndex] = $(this).attr('data');
        $('.s0-btn.s0-radio').removeClass('selected');
        $('.s0-nav.next').removeClass('disable');
        $(this).addClass('selected');
        if(isDebug){
          console.log("[" + quizContentsIndex + "] selected: " + $(this).attr('data'));
          console.log('@ now selected data:');
          console.log(quizSelectData);
        }
        if(quizContentsIndex == (quizLimIndex-1)){
          $navResult.removeClass('disable');
          $navResult.attr('href', _get_result_url());
        }
      });
    }

    function init_result_layout(){
      $('body').prepend(`
        <script>
        window.fbAsyncInit = function() {
          FB.init({
            appId            : `+ appID +`,
            autoLogAppEvents : true,
            xfbml            : true,
            version          : 'v3.0'
          });
        };

        (function(d, s, id){
           var js, fjs = d.getElementsByTagName(s)[0];
           if (d.getElementById(id)) {return;}
           js = d.createElement(s); js.id = id;
           js.src = "https://connect.facebook.net/en_US/sdk.js";
           fjs.parentNode.insertBefore(js, fjs);
         }(document, 'script', 'facebook-jssdk'));
        </script>
      `);
      $container = _create_element('div', opt.id.content, $view);
      $wrapper = _create_element('div', opt.id.wrapper, $container);
      $canvas  = _create_element('canvas', opt.id.canvas, $wrapper);
      $nav = _create_element('div', opt.id.navbar, $container);
      $navReturn = _create_element('a', opt.id.navReturn, $nav);
      $wrapper.append('<p style="padding: 0.5rem">'+quizData.meta.resultMsg+'</p>');
      $.each(valuesData, function(key, val){
        $wrapper.append('<h2 style="padding: 0.5rem">' + val.name + '</h2>');
        $wrapper.append('<p style="padding: 0.5rem">' + val.desc + '</p>');
      });
      $navReturn.addClass('s0-btn');
      $navReturn.html('처음으로');
      let href = url.origin;
      if(url.pathname){href += url.pathname}
      $navReturn.attr('href', href);
      $shareFB = _create_element('a', opt.id.shareFB, $nav);
      $shareFB.addClass('s0-btn');
      $shareFB.html('페이스북 공유');
    }
    function init_result_data(){
      let dataParam = url.search.substring(1).split('&');
      let quiz = quizData.contents;
      let counter = 0;
      $.each(quizData.values, function(key, val){
        valuesData[key] = {};
        valuesData[key]['name'] = val.name;
        valuesData[key]['desc'] = val.desc;
        valuesData[key]['point'] = 0;
        valuesData[key]['max'] = 0;
        valuesData[key]['ratio'] = 0;
        valuesData[key]['color'] = '';
      });
      $.each(dataParam, function(){
        if(this != 'result'){
          let items = this.split('=');
          let index  = parseInt(items[0]);
          let select = (parseFloat(items[1]) - 2) / 2;
          $.each(quiz[index].score, function(key,val){
            valuesData[key]['point'] += select * parseFloat(val);
            valuesData[key]['max'] += Math.abs(parseFloat(val));
          });
        }
      });
      $.each(valuesData, function(key,val){
        let ratio = (val.point + val.max) / (val.max * 2);
        valuesData[key]['ratio'] = ratio;
        valuesData[key]['color'] = colors[counter++ % colors.length];
      });
      if(isDebug){
        console.log('result-selected data:');
        console.log(valuesData);
      }
    }
    function init_result_events(){
      $shareFB.click(function(){
        let href;
        let msg = '';
        $.each(valuesData, function(key, val){
          msg += val.name + ': '
          msg += (val.ratio * 100).toFixed(1) + ' %\n' ;
        });
        msg += quizData.meta.resultMsg;
        if(isDebug){
          href = 'https://freethinkers-kr.github.io/';
          href += 'Values-of-Freethought/';
          href += url.search;
        } else {
          href = url.href;
        }
        FB.ui({
          name: '자유사상 가치척도',
          method: 'share',
          hashtag: '#Freethink_Values',
          href:  href,
          quote: msg,
        }, function(response){console.log(response)});
        if(isDebug){console.log(msg)}
      });
    }

    function set_quiz_contents(){
      isSelected = false;
      let quizContents = quizData.contents[quizContentsIndex];
      quizLimIndex = quizData.contents.length;
      $('.s0-radio').removeClass('selected');
      $desc.html(quizContents.desc);
      if(quizContents.score){
        isQuiz = true;
        $navNext.addClass('disable');
        let title = '[' + quizContentsIndex + '/' + (quizLimIndex-1) + ']'
        if(quizContents.title){title += quizContents.title}
        $title.html(title);
        $radio.show();
      } else {
        isQuiz = false;
        $navNext.removeClass('disable');
        $title.html(quizContents.title);
        $radio.hide();
      }
      if(quizContentsIndex == 0){
        $navPrev.hide(); $navNext.show(); $navResult.hide();
      } else if (quizContentsIndex == quizLimIndex-1) {
        $navPrev.show(); $navNext.hide(); $navResult.show();
      } else {
        $navPrev.show(); $navNext.show(); $navResult.hide();
      }
    }
    function draw_result_canvas(){
      let counter = 0;
      let b_margin = 15;
      let b_y0 = canvas.height * 0.2;
      let b_yf = canvas.height;
      let b_dy = (b_yf - b_y0) / Object.keys(valuesData).length;
      let b_x0 = canvas.width * 0.08;
      let b_xf = canvas.width * 0.95;
      let b_dx = b_xf - b_x0;

      let i_y0 = 0;
      let i_yf = b_y0;
      let i_x0 = 0;
      let i_xf = canvas.width;

      $canvas.attr('width', canvas.width);
      $canvas.attr('height', canvas.height);
      let ctx = $canvas[0].getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      _draw_info_bar(ctx, i_x0, i_y0, i_xf, i_yf);
      $.each(valuesData, function(key, val){
        let y0 = b_y0 + (b_dy * counter) + b_margin;
        let dy = b_dy - (b_margin * 2);
        _draw_values_bar(ctx, b_x0, y0, b_dx, dy, key, val);
        counter++;
      });
    }

    // sub functions
    function _create_element(tag, selector, target=null){
      let prop = selector.split('.'),
          elem = $('<'+tag+'>'),
          id   = '',
          cls  = '';
      $.each(prop, function(i, val){
        if (val.indexOf('#') >= 0){
          id += val.replace(/^#/, '');
        } else {
          cls += val + ' ';
        }
      });
      if (id.length) elem.attr('id', id);
      if (cls.length) elem.attr('class', cls.trim());
      if (target) {
        return elem.appendTo(target);
      } else {
        return elem
      }
    }
    function _load_json(url, callback){
      $.getJSON(url, function(data){
        callback(data);
      })
      .fail(
        function(request,status,error){
          console.log( "code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
      });
    }
    function _get_result_url(){
      let param = url.href + '?result';
      $.each(quizSelectData, function(key, val){
        param += '&' + key + '=' + val;
      });
      return param;
    }
    function _draw_info_bar(ctx, x0, y0, dx, dy){
      let bgColor = '#CE93D8';
      let txColor = '#000000';
      let subtxColor = 'rgba(0,0,0,0.5)';
      let fontsize = dy * 0.4;
      let subfontsize = dy * 0.2;
      let padding = 15;
      // background
      ctx.fillStyle = bgColor;
      ctx.fillRect(x0, y0, dx, dy);
      // version text
      ctx.fillStyle = subtxColor;
      ctx.textAlign="right";
      ctx.textBaseline="top";
      ctx.font = 'bold '+subfontsize+'px "Gothic A1"';
      ctx.fillText(quizData.meta.author, x0 + dx - padding, y0 + padding);
      ctx.fillText(quizData.meta.version, x0 + dx - padding, y0 + subfontsize + padding);
      // title text
      ctx.fillStyle = txColor;
      ctx.textAlign="left";
      ctx.textBaseline="bottom";
      ctx.font = 'bold '+fontsize+'px "Gothic A1"';
      ctx.fillText("결과", x0 + padding, y0 + dy - padding);
    }
    function _draw_values_bar(ctx, x0, y0, dx, dy, key, val){
      let img = new Image();
      img.src = 'img/' + key + '.png';
      let scale, hx, hy;
      // bar background
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#000';
      ctx.shadowOffsetY = 2;
      ctx.shadowOffsetX = 2;
      ctx.fillStyle = '#EEEEEE';
      ctx.fillRect(x0, y0, dx, dy);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowOffsetX = 0;
      // bar thumb
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = val.color;
      ctx.fillRect(x0, y0, dx * val.ratio, dy);
      ctx.globalAlpha = 1;
      // logo image
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#000';
      ctx.shadowOffsetY = 2;
      ctx.shadowOffsetX = 2;
      ctx.fillStyle = '#FFFFFF';
      ctx.lineWidth = 20;
      ctx.strokeStyle = val.color;
      ctx.beginPath();
      ctx.arc(x0, y0+(dy/2), dy/2, 0, Math.PI*2, false);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowOffsetX = 0;
      img.onload = function(){
        if(img.height >= img.width){
          scale = dy / img.height * 0.9;
          idx = img.width * scale;
          idy = img.height * scale;
          ix0 = x0 - (dy * 0.45) + (idy - idx) / 2;
          iy0 = y0;
        } else {
          scale = dy / img.width * 0.9;
          idx = img.width * scale;
          idy = img.height * scale;
          ix0 = x0 - dy * 0.45;
          iy0 = y0 + (idx - idy) / 2;
        }
        ctx.drawImage(img, ix0, iy0 ,idx, idy);
      };
      // text draw
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#333';
      ctx.shadowOffsetY = 2;
      ctx.shadowOffsetX = 2;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold '+(dy*0.4)+'px "Gothic A1"';
      ctx.textAlign="left";
      ctx.textBaseline="bottom";
      ctx.strokeStyle = val.color;
      ctx.lineWidth = 5;
      ctx.strokeText(val.name, x0 + (dy/4), y0 + (dy));
      ctx.fillText(val.name, x0 + (dy/4), y0 + (dy));
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowOffsetX = 0;
      if(val.ratio > 0.8) {
        ctx.fillStyle = '#FFFFFF';
      } else {
        ctx.fillStyle = '#000000';
      }
      ctx.lineWidth = 3;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.shadowBlur = 4;
      ctx.shadowColor = val.color;
      ctx.shadowOffsetY = 2;
      ctx.shadowOffsetX = 2;
      ctx.strokeText((val.ratio * 100).toFixed(1) + "%", x0 + dx - (dy/6), y0 + (dy/2));
      ctx.fillText((val.ratio * 100).toFixed(1) + "%", x0 + dx - (dy/6), y0 + (dy/2));
      ctx.shadowBlur = 0;
      ctx.lineWidth = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowOffsetX = 0;
    }

  } // End Plugin: S0 Quiz
}(jQuery)); // Exit jQuery Plugin
