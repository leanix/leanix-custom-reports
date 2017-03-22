/**
 * Created by mle on 15.03.2017.
 */
/**
 * FactSheetIndex takes JSON data structure from rest api and creates an indexed structure separated
 * by FactSheet type, e.g. byType.services.100001010 = {ID:100001010, name:'AC Management', ...}
 */
class FactsheetsIndex {

  constructor(data) {
    this.total = data.total;
    this.page = data.page;
    this.pageSize = data.pageSize;
    this.all = data.data;
    this.byType = {};
    this.byID = {};
    data.data.forEach((item) => {
      this.byID[item.ID] = item;
      if (!item.resourceType) {
        return;
      }
      let type = this.byType[item.resourceType];
      if (!type) {
        type = {};
        this.byType[item.resourceType] = type;
      }
      type[item.ID] = item;
    });
  }

  getSortedList = function (type, sorter = (a, b) => { return a.displayName.localeCompare(b.displayName); }) {
    const list = [];
    const typeObj = this.byType[type];
    if (!typeObj) {
      return list;
    }
    for (var key in typeObj) {
      if (typeObj.hasOwnProperty(key)) {
        list.push(typeObj[key]);
      }
    }
    list.sort(sorter);
    return list;
  };
}

export default FactsheetsIndex;
