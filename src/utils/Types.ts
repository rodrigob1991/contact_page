export type ChangePropertiesType<Object extends Record<string, any>, NewTypes extends [keyof Object & string, any][]> = {
    [Key in keyof Object]
    : SeekNewType<Key, NewTypes> extends undefined
        ? Object[Key]
        : SeekNewType<Key, NewTypes>
}

type SeekNewType<SearchKey, NewTypes extends [string, any][]> =
    NewTypes extends [infer NewType, ...infer Rest]
        ? NewType extends [string, any]
            ? SearchKey extends NewType[0]
                ? NewType[1]
                : Rest extends [string, any][]
                    ? SeekNewType<SearchKey, Rest>
                    : never
            : never
        : undefined