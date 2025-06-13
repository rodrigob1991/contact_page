 import {TransformerFactory, SourceFile, Node, factory, isNumericLiteral, visitEachChild, visitNode, isSourceFile} from "typescript"

const transformer: TransformerFactory<SourceFile> = (context) => {
  console.table("Transformer initialized")
  return (sourceFile) => {
    const visitor = (node: Node): Node => {
      if (isNumericLiteral(node)) {
        // add "as Integer" after numeric literals
        return node.parent
      }
      return visitEachChild(node, visitor, context)
    }

    return visitNode(sourceFile, visitor, isSourceFile)
  }
}

export default transformer 
