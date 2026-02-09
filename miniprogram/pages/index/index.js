// 启动即展示的页面：用 web-view 加载 H5
const app = getApp();

Page({
  data: {
    h5Url: ''
  },

  onLoad() {
    const url = app.globalData.h5Url || 'https://dog-project-git-prod-wensons-projects-bb20578e.vercel.app/';
    // 可在此根据场景拼接 query，例如 ?from=miniprogram
    this.setData({ h5Url: url });
  },

  onWebViewLoad() {
    console.log('[webview] H5 加载完成');
  },

  onWebViewError(e) {
    console.error('[webview] H5 加载失败', e.detail);
    wx.showToast({ title: '页面加载失败', icon: 'none' });
  },

  onWebViewMessage(e) {
    // H5 通过 wx.miniProgram.postMessage 发来的消息会在此收到
    console.log('[webview] message from H5', e.detail.data);
  }
});
