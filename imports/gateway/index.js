import { fetch } from "meteor/fetch"
import _ from 'lodash'
export default async function mergeApiOption () {
    const newUrl = this.request.originalUrl.replace('v2', 'v1');
    const request = {
        method: this.request.method,
        body: JSON.stringify(this.request.body),
        headers: this.request.headers
    }
    const body = mergeApiPostOption.call(this, request)
    console.log('body', body.selector);
    if (body) {
        request.body = JSON.stringify(body);
    }
    if (this.request.method == 'GET') {
        delete request.body
    }
    const result = await fetch(`http://${this.request.headers.host}${newUrl}`, request);
    return result.json();
}

function mergeApiPostOption () {
    const body = _.cloneDeep(this.request.body);
    const selector = body.selector || {};
    
    // const roles = Meteor.roles.find({ value: { $in: Roles.getRolesForUser(this.userId) }, scope: body.options.scope  }).fetch();
    // const rules = _.flattenDeep(roles.filter(item => item.rules).map(item => item.rules));
    // // const hasRule = rules.filter(item => this.request.url.contains(item.route));
    // const hasRule = rules;
    // hasRule.map(item => {
    //     const rule = RuleCollection.findOne({
    //         _id: item
    //     })
    //     const format = transfromFormat.call(this, JSON.parse(rule.format));
    //     if (selector.$and) {
    //         selector.$and.push(format);
    //     } else {
    //         selector.$and = [];
    //         selector.$and.push(format);
    //     }
    // })
    body.selector = selector;
    return body;
}

function transfromFormat (format) {
    Object.keys(format).map(key => {
        if (format[key] === '$user') {
            format[key] = this.userId
        }
    })
    return format
}