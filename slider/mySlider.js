/**
 * 轮播图的主要功能就是图片的自动切换和手动切换，其中手动切换由用户行为控制，自动切换由组件控制
 * 因此要实现的功能API如下：
 * 1. getSelectedItem(): 获取当前展示图片
 * 2. getSelectedItemIndex(): 获取当前展示图片索引号
 * 3. slidesTo(index): 轮播图跳转
 * 4. slidesPrev(): 上一张
 * 5. slidesNext(): 下一张
 * 6. start(): 开始轮播
 * 7. stop(): 停止轮播
 */

/**
 * v2思路追加
 * 1. 要实现HTML模板化，需要把轮播图的图片作为组件的props，构造函数需要接收images参数
 * 2. 组件需要对接收的images进行render处理，渲染成组件内部的节点
 * 3. 组件对插件同理需要进行渲染处理，因此插件要从函数变为对象，拥有渲染和控制用户行为的能力
 */

/**
 * v2.1思路追加
 * 尝试CSS模板化，使得轮播图的圆角和小圆圈的颜色由组件外部控制
 * 两种方法：
 * 1. 类名切换（圆角）
 * 2. 通过props修改全局CSS变量值（根元素变量），来达到更换主题的效果
 *    使用全局CSS变量是考虑到组件内部可能有多处应用到全局变量的主题色或是主题色的变种
 */

class Slider {
  constructor(id, opts = {
    images: [],
    cycle: 3000,
    style: {
      radius: false,
      themeColor: 'red'
    }
  }) {
    this.container = document.getElementById(id); // 轮播图容器，此时拿到的容器是一个空的div，需要进行渲染
    this.opts = opts;
    this.cycle = opts.cycle || 3000; // 循环时间
    this.container.innerHTML = this.render();
    this.items = this.container.querySelectorAll('.slider__item, .slider__item--selected'); // 轮播图
  }

  // 渲染组件内部的节点，返回节点的HTML代码（渲染结果）
  render() {
    // 获取props的图片
    const images = this.opts.images;
    // 获取生成的li的节点数组
    const content = images.map((img, i) => `<li class="slider__item${i===0?'--selected':''}">
                          <img src="${img}" />
                      </li>`);
    // 样式渲染
    const style = this.opts.style;
    this.container.className += style.radius ? ' slider--radius' : '';
    document.documentElement.style.setProperty('--theme-color', style.themeColor);
    return `<ul>${content.join("")}</ul>`;
  }

  getSelectedItem() {
    return this.container.querySelector('.slider__item--selected');
  }

  getSelectedItemIndex() {
    // *注意this.items是NodeList伪数组，需要先转换再使用indexOf方法
    return Array.from(this.items).indexOf(this.getSelectedItem());
  }

  slidesTo(idx) {
    // 去除当前item的选中状态
    const selected = this.getSelectedItem();
    if (selected) {
      selected.className = 'slider__item';
    }
    // 给目标item添加选中状态
    const item = this.items[idx];
    if (item) {
      item.className = 'slider__item--selected';
    }
    // 自定义事件向外传递轮播图组件的状态
    const detail = {
      index: idx
    };
    const event = new CustomEvent("slide", {
      bubbles: true,
      detail
    });
    this.container.dispatchEvent(event);
  }

  // *为了实现循环轮播，这里不能直接+或-，要用求模取余数的方式
  slidesPrev() {
    // this.slidesTo(this.getSelectedItemIndex()--);
    this.slidesTo((this.items.length + this.getSelectedItemIndex() - 1) % this.items.length);
  }

  slidesNext() {
    // this.slidesTo(this.getSelectedItemIndex()++);
    this.slidesTo((this.getSelectedItemIndex() + 1) % this.items.length);
  }

  start() {
    // 开始轮播前要先清空一下
    this.stop();
    // *注意这里不能直接把slidesNext作为定时器的handler，会导致this指向问题。直接作为handler会使得方法内部的this和类脱离关系，指向全局对象
    // this.timer = setInterval(this.slidesNext, this.cycle);
    this.timer = setInterval(() => {
      this.slidesNext();
    }, this.cycle);
  }

  stop() {
    clearInterval(this.timer);
  }

  /**
   * 手动切换由用户控制，包括点击上一个、下一个按钮，鼠标悬浮和离开底部小圆点这些行为
   * 把由用户行为控制的部分抽象成插件，要求插件内部对轮播图组件是黑箱的形式
   * 采取依赖注入的形式，组件内只需要注册插件即可
   */

  /**
   * v2追加：注册组件的插件要完成渲染和依赖注入的工作
   */

  registerPlugins(...plugins) {
    plugins.forEach(plugin => {
      // 1. 渲染插件，要创建DOM节点并添加到组件内
      const pluginContainer = document.createElement('div');
      pluginContainer.innerHTML = plugin.render(this.opts.images);
      this.container.appendChild(pluginContainer);
      // 2. 依赖注入
      plugin.action(this);
    });
  }
}

// 左箭头插件
const pluginPrevious = {
  render() {
    return '<a href="" class="slider__previous"></a>';
  },
  action(slider) {
    // *获取事件源，注意事件源是来自组件内部的
    const sliderPrev = slider.container.querySelector('.slider__previous');
    if (sliderPrev) {
      // 事件监听
      sliderPrev.addEventListener("click", () => {
        // *为了避免自动播放和手动切换的冲突
        slider.stop();
        slider.slidesPrev();
        slider.start();
        // 箭头用a标签定义，需要阻止默认行为
        e.preventDefault();
      })
    }
  }
}

// 右箭头插件
const pluginNext = {
  render() {
    return '<a href="" class="slider__next"></a>';
  },
  action(slider) {
    // 获取事件源，注意事件源是来自组件内部的
    const sliderNext = slider.container.querySelector('.slider__next');
    if (sliderNext) {
      // 事件监听
      sliderNext.addEventListener("click", e => {
        slider.stop();
        slider.slidesNext();
        slider.start();
        e.preventDefault();
      })
    }
  }
}

/**
 * 小圆点插件：
 * 1. 小圆点会随着组件的状态变化而变化：监听slide事件
 * 2. 鼠标悬浮小圆点可以进行轮播图的跳转：监听鼠标悬浮和离开，注意鼠标悬浮时轮播图是不动的
 */
const pluginControl = {
  render(images) {
    // *有几张图就有几个小圆点,map返回的是数组，要用join()拼接起来，否则会自带逗号
    return `<div class="slider__control">
    ${images.map((img,i)=>`<span class="slider__control-btn${i===0?'--selected':''}"></span>`).join("")}
  </div>`
  },
  action(slider) {
    const control = slider.container.querySelector('.slider__control');
    if (control) {
      const sliderBtns = control.querySelectorAll('.slider__control-btn, .slider__control-btn--selected');
      // 监听鼠标移动到control的子元素内事件
      control.addEventListener('mouseover', e => {
        // 获取用户的目标小圆点，即事件触发的元素
        const target = e.target;
        const idx = Array.from(sliderBtns).indexOf(target);
        if (idx >= 0) {
          slider.slidesTo(idx);
          slider.stop();
        }
      })
      // 监听鼠标离开事件
      control.addEventListener('mouseout', e => {
        slider.start();
      })
      // *注意这里对slide事件的监听，由于组件不知道插件的存在，组件在派发事件时的target是自己，因此事件源也是自己
      slider.container.addEventListener('slide', e => {
        const idx = e.detail.index;
        if (idx >= 0) {
          const selected = control.querySelector('.slider__control-btn--selected');
          selected.className = 'slider__control-btn';
          sliderBtns[idx].className = 'slider__control-btn--selected';
        }
      })
    }
  }
}

const mySlider = new Slider('my-slider', {
  images: ['https://p5.ssl.qhimg.com/t0119c74624763dd070.png',
    'https://p4.ssl.qhimg.com/t01adbe3351db853eb3.jpg',
    'https://p2.ssl.qhimg.com/t01645cd5ba0c3b60cb.jpg',
    'https://p4.ssl.qhimg.com/t01331ac159b58f5478.jpg'
  ],
  cycle: 3000,
  style: {
    radius: true,
    themeColor: 'pink'
  }
});
mySlider.registerPlugins(pluginControl, pluginPrevious, pluginNext);
mySlider.start();