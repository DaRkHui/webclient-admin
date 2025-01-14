import { defineStore } from 'pinia';
import { createStorage } from '@/utils/Storage';
import { store } from '@/store';
import { ACCESS_TOKEN, CURRENT_USER, IS_LOCKSCREEN } from '@/store/mutation-types';
import { ResultEnum } from '@/enums/httpEnum';

const Storage = createStorage({ storage: localStorage });
import { getUserInfo, login } from '@/api/system/user';
import { storage } from '@/utils/Storage';
import { useTabsViewStore } from './tabsView';

export interface IUserState {
  token: string;
  userid: string;
  username: string;
  welcome: string;
  avatar: string;
  permissions: any[];
  info: any;
}

export const useUserStore = defineStore({
  id: 'app-user',
  state: (): IUserState => ({
    token: Storage.get(ACCESS_TOKEN, ''),
    userid: '',
    username: Storage.get(CURRENT_USER, {}).username,
    welcome: '',
    avatar: '',
    permissions: [],
    info: Storage.get(CURRENT_USER, {}),
  }),
  getters: {
    getToken(): string {
      return this.token;
    },
    getUserId(): string {
      return this.userid;
    },
    getAvatar(): string {
      return this.avatar;
    },
    getNickname(): string {
      return this.username;
    },
    getPermissions(): [any][] {
      return this.permissions;
    },
    getUserInfo(): object {
      return this.info;
    },
  },
  actions: {
    setToken(token: string) {
      this.token = token;
    },
    setAvatar(avatar: string) {
      this.avatar = avatar;
    },
    setNickname(usernam: string) {
      this.username = usernam;
    },
    setPermissions(permissions) {
      this.permissions = permissions;
    },
    setUserInfo(info) {
      this.info = info;
    },
    setUserId(userid) {
      this.userid = userid;
    },
    // 登录
    async login(userInfo) {
      try {
        const response = await login(userInfo);
        const { list, code } = response;
        if (code === ResultEnum.SUCCESS) {
          const ex = 7 * 24 * 60 * 60 * 1000;

          storage.set(ACCESS_TOKEN, list.lastdoc, ex);
          storage.set(CURRENT_USER, list, ex);
          storage.set(IS_LOCKSCREEN, false);
          this.setAvatar(list.picture);
          this.setNickname(list.username);
          this.setToken(list.lastdoc);
          this.setUserId(list.userid);
          this.setUserInfo(list);
        }
        return Promise.resolve(response);
      } catch (e) {
        return Promise.reject(e);
      }
    },

    // 获取用户信息
    GetInfo() {
      const that = this;
      return new Promise((resolve, reject) => {
        const params = { doctorid: that.token };
        const formData = new window.FormData();
        for (const key in params) {
          if (Object.prototype.hasOwnProperty.call(params, key)) {
            const element = params[key];
            formData.append(key, element);
          }
        }
        getUserInfo(formData)
          .then((res) => {
            const { list } = res;
            // debugger;
            if (list && list.groupid) {
              const permissionsList = list.groupid.split(',');
              that.setPermissions(permissionsList);

              that.setUserInfo(list);
            } else {
              this.setPermissions([]);
              this.setUserInfo('');
              useTabsViewStore().closeAllTabs();
              storage.remove(ACCESS_TOKEN);
              storage.remove(CURRENT_USER);
              reject(new Error('getInfo: permissionsList must be a non-null array !'));

            }
            // that.setAvatar(result.avatar);
            resolve(res);

          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    // 登出
    async logout() {
      this.setPermissions([]);
      this.setUserInfo('');
      useTabsViewStore().closeAllTabs();
      storage.remove(ACCESS_TOKEN);
      storage.remove(CURRENT_USER);
      useTabsViewStore().closeAllTabs();
      return Promise.resolve('');
    },
  },
});

// Need to be used outside the setup
export function useUserStoreWidthOut() {
  return useUserStore(store);
}
function logout() {
  throw new Error('Function not implemented.');
}

