
/**
 * By ELAM && 2018-8-23
 */
// component/ESwitchTab.js
Component({
  /**
   * 组件的属性列表
   * themeColor主题颜色
   * color字体颜色
   * selectColor选中字体颜色
   * bind:currentTab监听
   * data传输数据（最多4个）
   * current默认选中
   */
  properties: {
    data: {
      type: Array,
      value: ['title1', 'title2', 'title3', 'title4']
    },
    color: {
      type: String,
      value: '#4b4b4b'
    },
    selectColor: {
      type: String,
      value: 'white'
    },
    themeColor: {
      type: String,
      value: '#64a1f0'
    },
    current: {
      type: String,
      value: 1
    },
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onTab: function (e) {
      var indx = e.currentTarget.dataset.current;
      this.setData({
        current: indx
      })
      this.triggerEvent('currentTab', indx, e);
    },
  }
})