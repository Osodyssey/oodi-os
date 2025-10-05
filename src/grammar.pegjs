\
        Start
          = _ statements:Statement* { return { type: 'Program', body: statements }; }

        Statement
          = SecretDecl / FnDecl / ExprStmt

        SecretDecl
          = 'secret' __ name:Identifier __ '=' __ value:StringLiteral _ {
              return { type: 'SecretDeclaration', name: name.name, value: value.value };
            }

        FnDecl
          = 'fn' __ name:Identifier __ '(' __ params:ParamList? __ ')' __ '{' _ body:Statement* '}' _ {
            return { type: 'FunctionDeclaration', name: name.name, params: params || [], body };
          }

        ParamList
          = first:Identifier rest:(_ ',' _ Identifier)* {
            return [first.name].concat(rest.map(r => r[3].name));
          }

        ExprStmt
          = expr:Expression _ { return { type: 'ExpressionStatement', expression: expr }; }

        Expression
          = CallExpr / Identifier / StringLiteral

        CallExpr
          = 'call' __ endpoint:StringLiteral __ 'with' __ data:ObjectLiteral {
            return { type: 'CallExpression', endpoint: endpoint.value, data };
          }

        ObjectLiteral
          = '{' _ pairs:(Pair (',' _ Pair)*)? _ '}' {
            const items = pairs ? [pairs[0]].concat(pairs[1].map(p=>p[2])) : [];
            const obj = {};
            items.forEach(p => obj[p.key] = p.value);
            return obj;
          }

        Pair
          = key:Identifier _ ':' _ value:(StringLiteral / Identifier) _ { return { key: key.name, value: value.value || value.name }; }

        Identifier
          = $([a-zA-Z_$][a-zA-Z0-9_$]*) { return { type: 'Identifier', name: text() }; }

        StringLiteral
          = '\"' chars:([^\"\\\] / '\\\\\"')* '\"' { return { type: 'StringLiteral', value: text().slice(1,-1) }; }

        _
          = [ \t\n\r]*

        __
          = [ \t\n\r]+
