
export default function(){
    return {
        "value": "backend-system",
        "label": "后台管理系统",
        "type": "permission",
        "class": "page",
        "children": [
            {
                "value": "scopes",
                "label": "作用域管理",
                "type": "permission",
                "class": "page",
                "children": [
                    {
                        "value": "create",
                        "label": "新建",
                        "type": "permission",
                        "class": "page",
                    },
                    {
                        "value": "edit",
                        "label": "编辑",
                        "type": "permission",
                        "class": "page",
                    }
                ]
            }
        ]
    }
}