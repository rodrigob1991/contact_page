 import {TransformerFactory, SourceFile, Node, factory, isNumericLiteral, visitEachChild, visitNode, isSourceFile, TypeChecker, Program, TransformationContext} from "typescript"
 import {PluginConfig, TransformerExtras} from "ts-patch"

const transformer = (program: Program, config: PluginConfig, extras: TransformerExtras) =>
  (context: TransformationContext) => {
    return (sourceFile: SourceFile) => {
      const visitor = (node: Node): Node => {
        if (isNumericLiteral(node)) {
          // add "as Integer" after numeric literals
          return factory.createAsExpression(node, factory.createTypeReferenceNode("Int"))
        }

        return visitEachChild(node, visitor, context)
      }

      return visitNode(sourceFile, visitor, isSourceFile)
    }
}

export default transformer