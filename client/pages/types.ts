import { Static, Type } from '@sinclair/typebox'
export const PersonModel = Type.Object({
  result: "@item" as any,
  name: Type.String(),
  age: Type.Number()
});
export type PersonModel = Static<typeof PersonModel>;

export const RootModel = Type.Object({
  result: "@Model" as any,
  data: Type.Object({
    basic: { ...PersonModel },
    children: Type.Array({ ...PersonModel })
  }),
  context: Type.Object({
    query: Type.Object({
      postId: Type.Number()
    })
  })
});
export type RootModel = Static<typeof RootModel>;