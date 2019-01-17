/**
 * @module Data.List
 *
 * A list (`[a]`) is a simple flat data structure for values of the same type.
 *
 * @author Lukas Obermann
 */

import { pipe } from "ramda";
import { add, inc, max, min, multiply } from "../App/Utils/mathUtils";
import { not } from "../App/Utils/not";
import { equals } from "./Eq";
import { cnst, ident } from "./Function";
import { fromJust, imapMaybe, isJust, Just, Maybe, maybe, Nothing } from "./Maybe";
import { isLTorEQ, Ordering } from "./Ord";
import { first, fromBinary, fromBoth, fst, Pair, second, snd } from "./Pair";
import { show } from "./Show";


// LIST TYPE DEFINITIONS

export type List<A> = Nil | Cons<A>

export type NonEmptyList<A> = Cons<A>


// PROTOTYPE

interface ListPrototype {
  readonly isList: true
}

const ListPrototype =
  Object.freeze<ListPrototype> ({
    isList: true,
  })


// CONSTRUCTORS

// Nil

export interface Nil extends ListPrototype { }

const Nil: Nil = Object.create (ListPrototype)

const isNil = (xs: List<any>): xs is Nil => xs === Nil

// Cons

export interface Cons<A> {
  readonly x: A
  readonly xs: List<A>
}

const Cons =
  <A> (x: A, xs: List<A>): Cons<A> =>
    Object.create (
      ListPrototype,
      {
        x: {
          value: x,
          enumerable: true,
        },
        xs: {
          value: xs,
          enumerable: true,
        },
      }
    )

/**
 * `fromArray :: Array a -> [a]`
 *
 * Creates a new `List` instance from the passed native `Array`.
 */
export const fromArray = <A> (xs: ReadonlyArray<A>): List<A> => {
  if (Array.isArray (xs)) {
    return fromArrayCons<A> (xs) (xs .length - 1) (Nil)
  }

  throw new TypeError (
    `fromArray requires an array but instead it received ${show (xs)}`
  )
}

const fromArrayCons =
  <A> (arr: ReadonlyArray<A>) => (index: number) => (h: List<A>): List<A> =>
    index < 0 ? h : fromArrayCons (arr) (index - 1) (Cons (arr[index], h))

/**
 * `fromElements :: (...a) -> [a]`
 *
 * Creates a new `List` instance from the passed arguments.
 */
export const fromElements = <A> (...values: A[]): List<A> => fromArray (values)


// FUNCTOR

/**
 * `fmap :: (a -> b) -> [a] -> [b]`
 */
export const fmap =
  <A, B> (f: (x: A) => B) => (xs: List<A>): List<B> =>
    isNil (xs) ? Nil : Cons (f (xs .x), fmap (f) (xs .xs))

/**
 * `(<$) :: Functor f => a -> f b -> f a`
 *
 * Replace all locations in the input with the same value. The default
 * definition is `fmap . const`, but this may be overridden with a more
 * efficient version.
 */
export const mapReplace = <A, B> (x: A) => fmap<B, A> (cnst (x))


// APPLICATIVE

/**
 * `pure :: a -> [a]`
 *
 * Lift a value.
 */
export const pure = <A> (x: A) => Cons (x, Nil)

/**
 * `(<*>) :: [a -> b] -> [a] -> [b]`
 *
 * Sequential application.
 */
export const ap =
  <A, B> (fs: List<(x: A) => B>) => (xs: List<A>): List<B> =>
    isNil (fs) || isNil (xs)
    ? Nil
    : mapAp<A, B> (head (fs)) (ap (fs .xs) (xs)) (xs)

const mapAp =
  <A, B>
  (f: (x: A) => B) =>
  (xs: List<B>) =>
  (x: List<A>): List<B> =>
    isNil (x)
    ? xs
    : Cons (f (x .x), mapAp (f) (xs) (x .xs))


// ALTERNATIVE

/**
 * `alt :: [a] -> [a] -> [a]`
 *
 * The `alt` function takes a list of the same type. If the first list
 * is empty, it returns the second list, otherwise it returns the
 * first.
 */
export const alt =
  <A> (xs1: List<A>) => (xs2: List<A>): List<A> =>
    isNil (xs1) ? xs2 : xs1

/**
 * `altF :: [a] -> [a] -> [a]`
 *
 * The `altF` function takes a `Maybe` of the same type. If the second `Maybe`
 * is `Nothing`, it returns the first `Maybe`, otherwise it returns the
 * second.
 *
 * Flipped version of `alt`.
 */
export const altF =
  <A> (xs1: List<A>) => (xs2: List<A>): List<A> =>
    alt (xs2) (xs1)

/**
 * `empty :: [a]`
 *
 * The empty list.
 */
export const empty = Nil

/**
 * `guard :: Bool -> [()]`
 *
 * Conditional failure of Alternative computations. Defined by
```hs
guard True  = pure ()
guard False = empty
```
  * In TypeScript, this is not possible, so instead it's
```ts
guard (true)  = pure (true)
guard (false) = empty
```
  */
export const guard =
  (pred: boolean): List<true> =>
    pred ? pure<true> (true) : empty


// MONAD

/**
 * `(>>=) :: [a] -> (a -> [b]) -> [b]`
 */
export const bind =
  <A, B> (xs: List<A>) => (f: (x: A) => List<B>): List<B> =>
    isNil (xs) ? Nil : append (f (xs .x))
                              (bind<A, B> (xs .xs) (f))

/**
 * `(=<<) :: (a -> [b]) -> [a] -> [b]`
 */
export const bindF =
  <A, B> (f: (x: A) => List<B>) => (xs: List<A>): List<B> =>
    bind<A, B> (xs) (f)

/**
 * `(>>) :: [a] -> [b] -> [b]`
 *
 * Sequentially compose two actions, discarding any value produced by the
 * first, like sequencing operators (such as the semicolon) in imperative
 * languages.
 *
 * ```a >> b = a >>= \ _ -> b```
 */
export const then =
  <A> (xs1: List<any>) => (xs2: List<A>): List<A> =>
    bind<any, A> (xs1) (_ => xs2)

/**
 * `(>=>) :: (a -> [b]) -> (b -> [c]) -> a -> [c]`
 *
 * Left-to-right Kleisli composition of monads.
 */
export const kleisli =
  <A, B, C> (f1: (x: A) => List<B>) => (f2: (x: B) => List<C>) =>
    pipe (f1, bindF (f2))

/**
 * `join :: [[a]] -> [a]`
 *
 * The `join` function is the conventional monad join operator. It is used to
 * remove one level of monadic structure, projecting its bound argument into the
 * outer level.
 */
export const join =
  <A> (xss: List<List<A>>): List<A> =>
    bind<List<A>, A> (xss) (ident)


// FOLDABLE

/**
 * `foldr :: (a -> b -> b) -> b -> [a] -> b`
 *
 * Right-associative fold of a structure.
 *
 * In the case of lists, `foldr`, when applied to a binary operator, a
 * starting value (typically the right-identity of the operator), and a list,
 * reduces the list using the binary operator, from right to left:
 *
 * ```foldr f z [x1, x2, ..., xn] == x1 `f` (x2 `f` ... (xn `f` z)...)```
 */
export const foldr =
  <A, B> (f: (x: A) => (acc: B) => B) => (initial: B) => (xs: List<A>): B =>
    isNil (xs) ? initial : f (xs .x) (foldr (f) (initial) (xs .xs))

/**
 * `foldl :: (b -> a -> b) -> b -> [a] -> b`
 *
 * Left-associative fold of a structure.
 *
 * In the case of lists, foldl, when applied to a binary operator, a starting
 * value (typically the left-identity of the operator), and a list, reduces
 * the list using the binary operator, from left to right:
 *
 * ```foldl f z [x1, x2, ..., xn] == (...((z `f` x1) `f` x2) `f`...) `f` xn```
 */
export const foldl =
  <A, B> (f: (acc: B) => (x: A) => B) => (initial: B) => (xs: List<A>): B =>
    isNil (xs) ? initial : foldl (f) (f (initial) (xs .x)) (xs .xs)

/**
 * `foldr1 :: (a -> a -> a) -> [a] -> a`
 *
 * A variant of `foldr` that has no base case, and thus may only be applied to
 * non-empty structures.
 *
 * `foldr1 f = foldr1 f . toList`
 */
export const foldr1 =
  <A> (f: (x: A) => (acc: A) => A) => (xs: List<A>): A => {
    if (!isNil (xs)) {
      return foldr1Safe (f) (xs)
    }

    throw new TypeError ("Cannot apply foldr1 to an empty list.")
  }

const foldr1Safe =
  <A> (f: (x: A) => (acc: A) => A) => (xs: Cons<A>): A =>
    isNil (xs .xs)
    ? xs .x
    : f (xs .x) (foldr1Safe (f) (xs .xs))

/**
 * `foldl1 :: (a -> a -> a) -> [a] -> a`
 *
 * A variant of `foldl` that has no base case, and thus may only be applied to
 * non-empty structures.
 *
 * `foldl1 f = foldl1 f . toList`
 */
export const foldl1 =
  <A> (f: (acc: A) => (x: A) => A) => (xs: List<A>): A => {
    if (!isNil (xs)) {
      return foldl1Safe (f) (xs .xs) (xs .x)
    }

    throw new TypeError ("Cannot apply foldl1 to an empty list.")
  }

const foldl1Safe =
  <A>
  (f: (acc: A) => (x: A) => A) =>
  (xs: List<A>) =>
  (acc: A): A =>
    isNil (xs) ? acc : foldl1Safe (f) (xs .xs) (f (acc) (xs .x))

/**
 * `toList :: [a] -> [a]`
 *
 * List of elements of a structure, from left to right.
 */
export const toList = <A> (xs: List<A>): List<A> => xs

/**
 * `null :: [a] -> Bool`
 *
 * Test whether the structure is empty. The default implementation is optimized
 * for structures that are similar to cons-lists, because there is no general
 * way to do better.
 */
export const fnull = isNil

/**
 * `length :: [a] -> Int`
 *
 * Returns the size/length of a finite structure as an `Int`. The default
 * implementation is optimized for structures that are similar to cons-lists,
 * because there is no general way to do better.
 */
export const length =
  (xs: List<any>): number =>
    foldr<any, number> (() => inc) (0) (xs)

/**
 * `elem :: Eq a => a -> [a] -> Bool`
 *
 * Does the element occur in the structure?
 */
export const elem =
  <A> (x: A) => (xs: List<A>): boolean =>
    isNil (xs) ? false : equals (x) (xs .x) || elem (x) (xs .xs)

/**
 * `elemF :: Eq a => [a] -> a -> Bool`
 *
 * Does the element occur in the structure?
 *
 * Flipped version of `elem`.
 */
export const elemF = <A> (xs: List<A>) => (x: A): boolean => elem (x) (xs)

/**
 * `sum :: Num a => [a] -> a`
 *
 * The `sum` function computes the sum of the numbers of a structure.
 */
export const sum = foldr (add) (0)

/**
 * `product :: Num a => [a] -> a`
 *
 * The `product` function computes the product of the numbers of a structure.
 */
export const product = foldr (multiply) (1)

/**
 * `maximum :: Ord a => [a] -> a`
 *
 * The largest element of a non-empty structure.
 */
export const maximum = foldr (max) (-Infinity)

/**
 * `minimum :: Ord a => [a] -> a`
 *
 * The least element of a non-empty structure.
 */
export const minimum = foldr (min) (Infinity)

// Specialized folds

/**
 * `concat :: [[a]] -> [a]`
 *
 * The concatenation of all the elements of a container of lists.
 */
export const concat = join

/**
 * `concatMap :: (a -> [b]) -> [a] -> [b]`
 *
 * Map a function over all the elements of a container and concatenate the
 * resulting lists.
 */
export const concatMap = bindF

/**
 * `and :: [Bool] -> Bool`
 *
 * `and` returns the conjunction of a container of Bools. For the result to be
 * `True`, the container must be finite. `False`, however, results from a
 * `False` value finitely far from the left end.
 */
export const and =
  (xs: List<boolean>): boolean =>
    isNil (xs) ? true : xs .x && and (xs .xs)

/**
 * `or :: [Bool] -> Bool`
 *
 * `or` returns the disjunction of a container of Bools. For the result to be
 * `False`, the container must be finite. `True`, however, results from a
 * `True` value finitely far from the left end.
 */
export const or =
  (xs: List<boolean>): boolean =>
    isNil (xs) ? false : xs .x || or (xs .xs)

/**
 * `any :: (a -> Bool) -> [a] -> Bool`
 *
 * Determines whether any element of the structure satisfies the predicate.
 */
export const any =
  <A> (f: (x: A) => boolean) => (xs: List<A>): boolean =>
    isNil (xs) ? false : f (xs .x) || any (f) (xs .xs)

/**
 * `all :: (a -> Bool) -> [a] -> Bool`
 *
 * Determines whether all elements of the structure satisfy the predicate.
 */
export const all =
  <A> (f: (x: A) => boolean) => (xs: List<A>): boolean =>
    isNil (xs) ? true : f (xs .x) && all (f) (xs .xs)

// Searches

/**
 * `notElem :: Eq a => a -> [a] -> Bool`
 *
 * `notElem` is the negation of `elem`.
 */
export const notElem = <A> (x: A) => pipe (elem (x), not)

/**
 * `notElemF :: Eq a => a -> [a] -> Bool`
 *
 * `notElemF` is the negation of `elem_`.
 *
 * `notElemF` is the same as `notElem` but with arguments flipped.
 */
export const notElemF = <A> (xs: List<A>) => (x: A) => notElem (x) (xs)

interface Find {
  /**
   * `find :: (a -> Bool) -> [a] -> Maybe a`
   *
   * The `find` function takes a predicate and a structure and returns the
   * leftmost element of the structure matching the predicate, or `Nothing` if
   * there is no such element.
   */
  <A, A1 extends A> (pred: (x: A) => x is A1): (xs: List<A>) => Maybe<A1>

  /**
   * `find :: (a -> Bool) -> [a] -> Maybe a`
   *
   * The `find` function takes a predicate and a structure and returns the
   * leftmost element of the structure matching the predicate, or `Nothing` if
   * there is no such element.
   */
  <A> (pred: (x: A) => boolean): (xs: List<A>) => Maybe<A>
}

/**
 * `find :: (a -> Bool) -> [a] -> Maybe a`
 *
 * The `find` function takes a predicate and a structure and returns the
 * leftmost element of the structure matching the predicate, or `Nothing` if
 * there is no such element.
 */
export const find: Find =
  <A> (pred: (x: A) => boolean) => (xs: List<A>): Maybe<A> =>
    isNil (xs) ? Nothing : pred (xs .x) ? Just (xs .x) : find (pred) (xs .xs)


// BASIC FUNCTIONS

/**
 * `(++) :: [a] -> [a] -> [a]`
 *
 * Append two lists.
 */
export const append =
  <A> (xs1: List<A>) => (xs2: List<A>): List<A> =>
    isNil (xs2) ? xs1 : isNil (xs1) ? xs2 : appendSafe (xs1) (xs2)

const appendSafe =
  <A> (xs1: List<A>) => (xs2: Cons<A>): Cons<A> =>
    isNil (xs1) ? xs2 : Cons (xs1 .x, appendSafe (xs1 .xs) (xs2))

/**
 * `(++) :: String -> String -> String`
 *
 * Append two lists.
 */
export const appendStr =
  (xs1: string) => (xs2: string): string =>
    xs1 + xs2

/**
 * `(:) :: [a] -> a -> [a]`
 *
 * Prepends an element to the list.
 */
export const cons = <A> (xs: List<A>) => (x: A): List<A> => Cons (x, xs)

/**
 * `head :: [a] -> a`
 *
 * Extract the first element of a list, which must be non-empty.
 */
export const head = <A> (xs: Cons<A>): A => {
  if (isNil (xs)) {
    throw new TypeError (
      `head does only work on non-empty lists. If you do not know whether the`
      + `list is empty or not, use listToMaybe instead.`
    )
  }

  return xs .x
}

/**
 * `last :: [a] -> a`
 *
 * Extract the last element of a list, which must be finite and non-empty.
 */
export const last = <A> (xs: Cons<A>): A => {
  if (isNil (xs)) {
    throw new TypeError (`last does only work on non-empty lists.`)
  }

  return isNil (xs .xs) ? xs .x : last (xs .xs)
}

/**
 * `lastS :: [a] -> Maybe a`
 *
 * Extract the last element of a list, which must be finite. If the list is
 * empty, it returns `Nothing`. If the list is not empty, it returns the last
 * element wrapped in a `Just`.
 *
 * A safe version of `last`.
 */
export const lastS =
  <A> (xs: List<A>): Maybe<A> =>
    fnull (xs) ? Nothing : Just (last (xs))

/**
 * `tail :: [a] -> [a]`
 *
 * Extract the elements after the head of a list, which must be non-empty.
 */
export const tail = <A> (xs: Cons<A>): List<A> => {
  if (isNil (xs)) {
    throw new TypeError (`tail does only work on non-empty lists.`)
  }

  return xs .xs
}

/**
 * `tailS :: [a] -> Maybe [a]`
 *
 * Extract the elements after the head of a list. If the list is
 * empty, it returns `Nothing`. If the list is not empty, it returns the
 * elements wrapped in a `Just`.
 *
 * A safe version of `tail`.
 */
export const tailS =
  <A> (xs: List<A>): Maybe<List<A>> =>
    fnull (xs) ? Nothing : Just (tail (xs))

/**
 * `init :: [a] -> [a]`
 *
 * Return all the elements of a list except the last one. The list must be
 * non-empty.
 */
export const init = <A> (xs: Cons<A>): List<A> => {
  if (isNil (xs)) {
    throw new TypeError (`init does only work on non-empty lists.`)
  }

  return isNil (xs .xs) ? Nil : Cons (xs .x, init (xs .xs))
}

/**
 * `initS :: [a] -> Maybe [a]`
 *
 * Return all the elements of a list except the last one. If the list is
 * empty, it returns `Nothing`. If the list is not empty, it returns the
 * elements wrapped in a `Just`.
 *
 * A safe version of `init`.
 */
export const initS =
  <A> (xs: List<A>): Maybe<List<A>> =>
    fnull (xs) ? Nothing : Just (init (xs))

/**
 * `uncons :: [a] -> Maybe (a, [a])`
 *
 * Decompose a list into its head and tail. If the list is empty, returns
 * `Nothing`. If the list is non-empty, returns `Just (x, xs)`, where `x` is
 * the head of the list and `xs` its tail.
 */
export const uncons =
  <A> (xs: List<A>): Maybe<Pair<A, List<A>>> =>
    fnull (xs) ? Nothing : Just (fromBinary (xs .x, tail (xs)))


// LIST TRANSFORMATIONS

/**
 * `map :: (a -> b) -> [a] -> [b]`
 *
 * `map f xs` is the list obtained by applying `f` to each element of `xs`.
 */
export const map = fmap

/**
 * `reverse :: [a] -> [a]`
 *
 * `reverse xs` returns the elements of `xs` in reverse order. `xs` must be
 * finite.
 */
export const reverse =
  <A> (xs: List<A>): List<A> =>
    foldl<A, List<A>> (cons) (empty) (xs)

/**
 * `intercalate :: [a] -> [[a]] -> [a]`
 *
 * `intercalate xs xss` is equivalent to `(concat (intersperse xs xss))`. It
 * inserts the list `xs` in between the lists in `xss` and concatenates the
 * result.
 */
export const intercalate =
  (separator: string) => (xs: List<number | string>): string =>
    isNil (xs)
    ? ""
    : isNil (xs .xs)
    ? xs .x .toString ()
    : xs .x .toString () + separator + intercalate (separator) (xs .xs)


// BUILDING LISTS


// SCANS

/**
 * `scanl :: (b -> a -> b) -> b -> [a] -> [b]`
 *
 * scanl is similar to foldl, but returns a list of successive reduced values
 * from the left:
 *
 * ```scanl f z [x1, x2, ...] == [z, z `f` x1, (z `f` x1) `f` x2, ...]```
 *
 * Note that
 *
 * ```last (scanl f z xs) == foldl f z xs.```
 */
export const scanl =
  <A, B>
  (f: (acc: B) => (x: A) => B) =>
  (initial: B) =>
  (xs: List<A>): List<B> =>
    Cons (initial, scanlIterator (f) (initial) (xs))

const scanlIterator =
  <A, B>
  (f: (acc: B) => (x: A) => B) =>
  (acc: B) =>
  (xs: List<A>): List<B> => {
    if (!isNil (xs)) {
      const x = f (acc) (xs .x)

      return Cons (x, scanlIterator (f) (x) (xs .xs))
    }

    return Nil
  }


// ACCUMULATING MAPS

/**
 * `mapAccumL :: (a -> b -> (a, c)) -> a -> [b] -> (a, [c])`
 *
 * The `mapAccumL` function behaves like a combination of `fmap` and `foldl`
 * it applies a function to each element of a structure, passing an
 * accumulating parameter from left to right, and returning a final value of
 * this accumulator together with the new structure.
 */
export const mapAccumL =
  <A, B, C>
  (f: (acc: A) => (x: B) => Pair<A, C>) =>
  (initial: A) =>
  (xs: List<B>): Pair<A, List<C>> => {
    if (!isNil (xs)) {
      const p = f (initial) (xs .x)

      const res = mapAccumL<A, B, C> (f) (fst (p)) (xs .xs)

      return fromBinary (fst (res), Cons (snd (p), snd (res)))
    }

    return fromBinary (initial, Nil)
  }


// UNFOLDING

/**
 * `unfoldr :: (b -> Maybe (a, b)) -> b -> [a]`
 *
 * The `unfoldr` function is a 'dual' to `foldr`: while `foldr` reduces a list
 * to a summary value, `unfoldr` builds a list from a seed value. The function
 * takes the element and returns `Nothing` if it is done producing the list or
 * returns `Just (a,b)`, in which case, `a` is a prepended to the list and `b`
 * is used as the next element in a recursive call. For example,
```hs
iterate f == unfoldr (\x -> Just (x, f x))
```
  *
  * In some cases, unfoldr can undo a foldr operation:
  *
```hs
unfoldr f' (foldr f z xs) == xs
```
  *
  * if the following holds:
  *
```hs
f' (f x y) = Just (x,y)
f' z       = Nothing
```
  *
  * A simple use of unfoldr:
  *
```hs
>>> unfoldr (\b -> if b == 0 then Nothing else Just (b, b-1)) 10
[10,9,8,7,6,5,4,3,2,1]
```
  */
export const unfoldr =
  <A, B> (f: (x: B) => Maybe<Pair<A, B>>) => (seedValue: B): List<A> => {
    const result = f (seedValue)

    if (isJust (result)) {
      const newValue = fromJust (result)

      return Cons (fst (newValue), unfoldr (f) (snd (newValue)))
    }

    return Nil
  }


// EXTRACTING SUBLISTS

/**
 * `take :: Int -> [a] -> [a]`
 *
 * `take n`, applied to a list `xs`, returns the prefix of `xs` of length `n`,
 * or `xs` itself if `n > length xs`.
 */
export const take =
  <A> (n: number) => (xs: List<A>): List<A> =>
    n <= 0 || isNil (xs) ? Nil : Cons (xs .x, take<A> (n - 1) (xs .xs))

/**
 * `drop :: Int -> [a] -> [a]`
 *
 * `drop n xs` returns the suffix of `xs` after the first `n` elements, or
 * `[]` if `n > length x`.
 */
export const drop =
  <A> (n: number) => (xs: List<A>): List<A> =>
    n <= 0 ? xs : isNil (xs) ? Nil : drop<A> (n - 1) (xs .xs)

/**
 * `splitAt :: Int -> [a] -> ([a], [a])`
 *
 * `splitAt n xs` returns a tuple where first element is `xs` prefix of length
 * `n` and second element is the remainder of the list.
 */
export const splitAt =
  <A> (n: number) => (xs: List<A>): Pair<List<A>, List<A>> => {
    if (n <= 0) {
      return fromBinary (Nil, xs)
    }

    if (isNil (xs)) {
      return fromBinary (Nil, Nil)
    }

    const y = xs .x

    const p = splitAt<A> (n - 1) (xs .xs)

    return fromBinary (Cons (y, fst (p)), snd (p))
  }


// PREDICATES

/**
 * `isSubsequenceOf :: Eq a => [a] -> [a] -> Bool`
 *
 * The `isSubsequenceOf` function takes two lists and returns `True` if all the
 * elements of the first list occur, in order, in the second. The elements do
 * not have to occur consecutively.
 *
 * `isSubsequenceOf x y` is equivalent to `elem x (subsequences y)`.
 */
export const isSubsequenceOf =
  (x: string) => (y: string): boolean =>
    y .includes (x)


// SEARCHING BY EQUALITY

/**
 * `lookup :: Eq a => a -> [(a, b)] -> Maybe b`
 *
 * `lookup key assocs` looks up a key in an association list.
 */
export const lookup = <K, V> (key: K) => (assocs: List<Pair<K, V>>): Maybe<V> =>
  Maybe.fmap<Pair<K, V>, V> (snd)
                            (find<Pair<K, V>> (pipe (fst, equals (key)))
                                              (assocs))


// SEARCHING WITH A PREDICATE

interface Filter {
  /**
   * `filter :: (a -> Bool) -> [a] -> [a]`
   *
   * `filter`, applied to a predicate and a list, returns the list of those
   * elements that satisfy the predicate.
   */
  <A, A1 extends A> (pred: (x: A) => x is A1): (xs: List<A>) => List<A1>

  /**
   * `filter :: (a -> Bool) -> [a] -> [a]`
   *
   * `filter`, applied to a predicate and a list, returns the list of those
   * elements that satisfy the predicate.
   */
  <A> (pred: (x: A) => boolean): (xs: List<A>) => List<A>
}

/**
 * `filter :: (a -> Bool) -> [a] -> [a]`
 *
 * `filter`, applied to a predicate and a list, returns the list of those
 * elements that satisfy the predicate.
 */
export const filter: Filter =
  <A> (pred: (x: A) => boolean) => (xs: List<A>): List<A> =>
    foldr<A, List<A>> (x => pred (x) ? consF (x) : ident)
                      (Nil)
                      (xs)

/**
 * `partition :: (a -> Bool) -> [a] -> ([a], [a])`
 *
 * The `partition` function takes a predicate a list and returns the pair of
 * lists of elements which do and do not satisfy the predicate, respectively.
 *
 * ```haskell
 * >>> partition (`elem` "aeiou") "Hello World!"
 * ("eoo","Hll Wrld!")
 * ```
  */
export const partition =
  <A>
  (pred: (value: A) => boolean) =>
    foldr<A, Pair<List<A>, List<A>>>
      (x => pred (x) ? first (consF (x)) : second (consF (x)))
      (fromBinary (Nil, Nil))


// INDEXING LISTS

/**
 * `(!!) :: [a] -> Int -> Maybe a`
 *
 * List index (subscript) operator, starting from 0. If the index is invalid,
 * returns `Nothing`, otherwise `Just a`.
 */
export const subscript =
  <A> (xs: List<A>) => (index: number): Maybe<A> =>
    isNil (xs) || index < 0
    ? Nothing
    : index > 0
    ? subscript (xs .xs) (index - 1)
    : Just (xs .x)

/**
 * `(!!) :: Int -> [a] -> Maybe a`
 *
 * List index (subscript) operator, starting from 0. If the index is invalid,
 * returns `Nothing`, otherwise `Just a`.
 *
 * Flipped version of `subscript`.
 */
export const subscriptF =
  (index: number) => <A> (xs: List<A>): Maybe<A> =>
    subscript (xs) (index)

/**
 * `elemIndex :: Eq a => a -> [a] -> Maybe Int`
 *
 * The `elemIndex` function returns the index of the first element in the
 * given list which is equal (by `==`) to the query element, or `Nothing` if
 * there is no such element.
 */
export const elemIndex =
  <A> (x: A) => (xs: List<A>): Maybe<number> =>
    isNil (xs)
    ? Nothing
    : equals (x) (xs .x)
    ? Just (0)
    : Maybe.fmap (inc) (elemIndex (x) (xs .xs))

/**
 * `elemIndices :: Eq a => a -> [a] -> [Int]`
 *
 * The `elemIndices` function extends `elemIndex`, by returning the indices of
 * all elements equal to the query element, in ascending order.
 */
export const elemIndices =
  <A> (x: A) => (xs: List<A>): List<number> =>
    elemIndicesIndex (x) (0) (xs)

const elemIndicesIndex =
  <A> (x: A) => (index: number) => (xs: List<A>): List<number> =>
    isNil (xs)
    ? Nil
    : equals (x) (xs .x)
    ? Cons (index, elemIndicesIndex (x) (index + 1) (xs .xs))
    : elemIndicesIndex (x) (index + 1) (xs .xs)

/**
 * `findIndex :: (a -> Bool) -> [a] -> Maybe Int`
 *
 * The `findIndex` function takes a predicate and a list and returns the index
 * of the first element in the list satisfying the predicate, or `Nothing` if
 * there is no such element.
 */
export const findIndex =
  <A> (pred: (x: A) => boolean) => (xs: List<A>): Maybe<number> =>
    isNil (xs)
    ? Nothing
    : pred (xs .x)
    ? Just (0)
    : Maybe.fmap (inc) (findIndex (pred) (xs .xs))

/**
 * `findIndices :: (a -> Bool) -> [a] -> [Int]`
 *
 * The `findIndices` function extends `findIndex`, by returning the indices of
 * all elements satisfying the predicate, in ascending order.
 */
export const findIndices =
  <A> (pred: (x: A) => boolean) => (xs: List<A>): List<number> =>
    findIndicesIndex (pred) (0) (xs)

const findIndicesIndex =
  <A>
  (pred: (x: A) => boolean) =>
  (index: number) =>
  (xs: List<A>): List<number> =>
    isNil (xs)
    ? Nil
    : pred (xs .x)
    ? Cons (index, findIndicesIndex (pred) (index + 1) (xs .xs))
    : findIndicesIndex (pred) (index + 1) (xs .xs)


// ZIPPING AND UNZIPPING LISTS

/**
 * `zip :: [a] -> [b] -> [(a, b)]`
 *
 * `zip` takes two lists and returns a list of corresponding pairs. If one
 * input list is short, excess elements of the longer list are discarded.
 */
export const zip =
  <A, B> (xs1: List<A>) => (xs2: List<B>): List<Pair<A, B>> =>
    zipWith<A, B, Pair<A, B>> (fromBoth) (xs1) (xs2)

/**
 * `zipWith :: (a -> b -> c) -> [a] -> [b] -> [c]`
 *
 * `zipWith` generalises `zip` by zipping with the function given as the first
 * argument, instead of a tupling function. For example, `zipWith (+)` is
 * applied to two lists to produce the list of corresponding sums.
 */
export const zipWith =
  <A, B, C>
  (f: (x1: A) => (x2: B) => C) =>
  (xs1: List<A>) =>
  (xs2: List<B>): List<C> =>
    imapMaybe<A, C> (index => e => Maybe.fmap (f (e)) (subscript (xs2) (index)))
                    (xs1)


// SPECIAL LISTS

// Functions on strings

/**
 * `lines :: String -> [String]`
 *
 * `lines` breaks a string up into a list of strings at newline characters. The
 * resulting strings do not contain newlines.
 *
 * Note that after splitting the string at newline characters, the last part of
 * the string is considered a line even if it doesn't end with a newline. For
 * example,
 *
 * ```haskell
 * >>> lines ""
 * []
 * ```
 *
 * ```haskell
 * >>> lines "\n"
 * [""]
 * ```
 *
 * ```haskell
 * >>> lines "one"
 * ["one"]
 * ```
 *
 * ```haskell
 * >>> lines "one\n"
 * ["one"]
 * ```
 *
 * ```haskell
 * >>> lines "one\n\n"
 * ["one",""]
 * ```
 *
 * ```haskell
 * >>> lines "one\ntwo"
 * ["one","two"]
 * ```
 *
 * ```haskell
 * >>> lines "one\ntwo\n"
 * ["one","two"]
 * ```
 *
 * Thus `lines s` contains at least as many elements as newlines in `s`.
 */
export const lines =
  (x: string): List<string> =>
    x .length === 0
    ? empty
    : fromArray (x .replace (/\n$/, "") .split (/\n/))


// "SET" OPERATIONS

/**
 * `delete :: Eq a => a -> [a] -> [a]`
 *
 * `delete x` removes the first occurrence of `x` from its list argument.
 */
export const sdelete =
  <A> (x: A) => (xs: List<A>): List<A> =>
    isNil (xs)
    ? Nil
    : equals (x) (xs .x)
    ? xs .xs
    : Cons (xs .x, sdelete (x) (xs .xs))


// ORDERED LISTS

/**
 * `sortBy :: (a -> a -> Ordering) -> [a] -> [a]`
 *
 * The `sortBy` function is the non-overloaded version of `sort`.
 */
export const sortBy =
  <A> (f: (a: A) => (b: A) => Ordering) => (xs: List<A>): List<A> =>
    sortByNodeMergeSort (f) (xs)

const sortByNodeMergeSort =
  <A>
  (f: (a: A) => (b: A) => Ordering) =>
  (xs: List<A>): List<A> => {
    // Base case: if head is undefined
    if (isNil (xs) || isNil (xs .xs)) {
      return xs
    }

    // get the two halfs of the list
    const parts = sortByGetMiddle (xs)

    // Apply mergeSort on left list
    const left = sortByNodeMergeSort (f) (fst (parts))

    // Apply mergeSort on right list
    const right = sortByNodeMergeSort (f) (snd (parts))

    // Merge the left and right lists
    return sortBySortedMerge (f) (left, right)
  }

const sortBySortedMerge =
  <A>
  (f: (a: A) => (b: A) => Ordering) =>
  (a: List<A>, b: List<A>): List<A> => {
    /* Base cases */
    if (isNil (a)) {
      return b
    }

    if (isNil (b)) {
      return a
    }

    /* Pick either a or b, and recur */
    return isLTorEQ (f (head (a)) (head (b)))
      ? Cons (head (a), sortBySortedMerge (f) (a .xs, b))
      : Cons (head (b), sortBySortedMerge (f) (a, b .xs))
  }

const sortByGetMiddle = <A> (xs: List<A>): Pair<List<A>, List<A>> =>
  splitAt<A> (length (xs) / 2) (xs)


// LIST.INDEX

// Original functions

/**
 * `indexed :: [a] -> [(Int, a)]`
 *
 * `indexed` pairs each element with its index.
 *
 * ```haskell
 * >>> indexed "hello"
 * [(0,'h'),(1,'e'),(2,'l'),(3,'l'),(4,'o')]
 * ```
 */
export const indexed = <A> (xs: List<A>): List<Pair<number, A>> =>
  imap<A, Pair<number, A>> (fromBoth) (xs)

/**
 * `deleteAt :: Int -> [a] -> [a]`
 *
 * `deleteAt` deletes the element at an index.
 *
 * If the index is negative or exceeds list length, the original list will be
 * returned.
 */
export const deleteAt =
  <A> (index: number) => (xs: List<A>): List<A> =>
    index < 0
    ? xs
    : isNil (xs)
    ? Nil
    : index === 0
    ? xs .xs
    : Cons (xs .x, deleteAt<A> (index - 1) (xs .xs))

/**
 * `setAt :: Int -> a -> [a] -> [a]`
 *
 * `setAt` sets the element at the index.
 *
 * If the index is negative or exceeds list length, the original list will be
 * returned.
 */
export const setAt =
  <A> (index: number) => (x: A) => (xs: List<A>): List<A> =>
    index < 0
    ? xs
    : isNil (xs)
    ? Nil
    : index === 0
    ? Cons (x, xs .xs)
    : Cons (xs .x, setAt<A> (index - 1) (x) (xs .xs))

/**
 * `modifyAt :: Int -> (a -> a) -> [a] -> [a]`
 *
 * `modifyAt` applies a function to the element at the index.
 *
 * If the index is negative or exceeds list length, the original list will be
 * returned.
 */
export const modifyAt =
  <A> (index: number) => (f: (old_value: A) => A) => (xs: List<A>): List<A> =>
    index < 0
    ? xs
    : isNil (xs)
    ? Nil
    : index === 0
    ? Cons (f (xs .x), xs .xs)
    : Cons (xs .x, modifyAt<A> (index - 1) (f) (xs .xs))

/**
 * `updateAt :: Int -> (a -> Maybe a) -> [a] -> [a]`
 *
 * `updateAt` applies a function to the element at the index, and then either
 * replaces the element or deletes it (if the function has returned
 * `Nothing`).
 *
 * If the index is negative or exceeds list length, the original list will be
 * returned.
 */
export const updateAt =
  <A>
  (index: number) =>
  (f: (old_value: A) => Maybe<A>) =>
  (xs: List<A>): List<A> =>
    index < 0
    ? xs
    : isNil (xs)
    ? Nil
    : index === 0
    ? maybe<A, List<A>> (xs .xs)
                        ((x: A) => Cons (x, xs .xs))
                        (f (xs .x))
    : Cons (xs .x, updateAt<A> (index - 1) (f) (xs .xs))

/**
 * `insertAt :: Int -> a -> [a] -> [a]`
 *
 * `insertAt` inserts an element at the given position:
 *
 * `(insertAt i x xs) !! i == x`
 *
 * If the index is negative or exceeds list length, the original list will be
 * returned. (If the index is equal to the list length, the insertion can be
 * carried out.)
 */
export const insertAt =
  <A> (index: number) => (x: A) => (xs: List<A>): List<A> =>
    index < 0
    ? xs
    : isNil (xs)
    ? Nil
    : index === 0
    ? Cons (x, xs)
    : Cons (xs .x, insertAt<A> (index - 1) (x) (xs .xs))

// Maps

/**
 * `imap :: (Int -> a -> b) -> [a] -> [b]`
 *
 * `imap f xs` is the list obtained by applying `f` to each element of `xs`.
 */
export const imap =
  <A, B> (f: (index: number) => (x: A) => B) => (xs: List<A>): List<B> =>
    ifoldr (i => pipe (f (i), consF)) (Nil) (xs)

// Folds

/**
 * `ifoldr :: (Int -> a -> b -> b) -> b -> [a] -> b`
 *
 * Right-associative fold of a structure.
 */
export const ifoldr =
  <A, B>
  (f: (index: number) => (current: A) => (acc: B) => B) =>
  (initial: B) =>
  (xs: List<A>): B =>
    ifoldrSafe (f) (0) (initial) (xs)

const ifoldrSafe =
  <A, B>
  (f: (index: number) => (current: A) => (acc: B) => B) =>
  (index: number) =>
  (acc: B) =>
  (xs: List<A>): B =>
    isNil (xs)
    ? acc
    : f (index) (xs .x) (ifoldrSafe (f) (index + 1) (acc) (xs .xs))

/**
 * `ifoldl :: Foldable t => (b -> Int -> a -> b) -> b -> t a -> b`
 *
 * Left-associative fold of a structure.
 *
 * In the case of lists, `ifoldl`, when applied to a binary operator, a
 * starting value (typically the left-identity of the operator), and a list,
 * reduces the list using the binary operator, from left to right.
 */
export const ifoldl =
  <A, B>
  (f: (acc: B) => (index: number) => (current: A) => B) =>
  (initial: B) =>
  (xs: List<A>): B =>
    ifoldlIterator (f) (0) (initial) (xs)

const ifoldlIterator =
  <A, B>
  (f: (acc: B) => (index: number) => (current: A) => B) =>
  (index: number) =>
  (acc: B) =>
  (xs: List<A>): B =>
    isNil (xs)
    ? acc
    : ifoldlIterator (f) (index + 1) (f (acc) (index) (xs .x)) (xs .xs)

/**
 * `iall :: Foldable t => (Int -> a -> Bool) -> t a -> Bool`
 *
 * Determines whether all elements of the structure satisfy the predicate.
 */
export const iall =
  <A> (f: (index: number) => (x: A) => boolean) => (xs: List<A>): boolean =>
    iallIterator (f) (0) (xs)

const iallIterator =
  <A>
  (f: (index: number) => (x: A) => boolean) =>
  (index: number) =>
  (xs: List<A>): boolean =>
    isNil (xs)
    ? true
    : f (index) (xs .x) && iallIterator (f) (index + 1) (xs .xs)

/**
 * `iany :: Foldable t => (Int -> a -> Bool) -> t a -> Bool`
 *
 * Determines whether any element of the structure satisfies the predicate.
 */
export const iany =
  <A> (f: (index: number) => (x: A) => boolean) => (xs: List<A>): boolean =>
    ianyIterator (f) (0) (xs)

const ianyIterator =
  <A>
  (f: (index: number) => (x: A) => boolean) =>
  (index: number) =>
  (xs: List<A>): boolean =>
    isNil (xs)
    ? false
    : f (index) (xs .x) || ianyIterator (f) (index + 1) (xs .xs)

/**
 * `iconcatMap :: (Int -> a -> [b]) -> [a] -> [b]`
 */
export const iconcatMap =
  <A, B> (f: (index: number) => (x: A) => List<B>) => (xs: List<A>): List<B> =>
    iconcatMapIterator (f) (0) (xs)

const iconcatMapIterator =
  <A, B>
  (f: (index: number) => (x: A) => List<B>) =>
  (index: number) =>
  (xs: List<A>): List<B> =>
    isNil (xs)
    ? Nil
    : append (f (index) (xs .x))
             (iconcatMapIterator (f) (index + 1) (xs .xs))

// Sublists

interface Ifilter {
  /**
   * `ifilter :: (Int -> a -> Bool) -> [a] -> [a]`
   *
   * `ifilter`, applied to a predicate and a list, returns the list of those
   * elements that satisfy the predicate.
   */
  <A, A1 extends A>
  (pred: (index: number) => (x: A) => x is A1):
  (xs: List<A>) => List<A1>

  /**
   * `ifilter :: (Int -> a -> Bool) -> [a] -> [a]`
   *
   * `ifilter`, applied to a predicate and a list, returns the list of those
   * elements that satisfy the predicate.
   */
  <A> (pred: (index: number) => (x: A) => boolean): (xs: List<A>) => List<A>
}

/**
 * `ifilter :: (Int -> a -> Bool) -> [a] -> [a]`
 *
 * `ifilter`, applied to a predicate and a list, returns the list of those
 * elements that satisfy the predicate.
 */
export const ifilter: Ifilter =
  <A> (pred: (index: number) => (x: A) => boolean) => (xs: List<A>): List<A> =>
    ifoldr<A, List<A>> (i => x => pred (i) (x) ? consF (x) : ident)
                       (Nil)
                       (xs)

/**
 * `ipartition :: (Int ->a -> Bool) -> [a] -> ([a], [a])`
 *
 * The `ipartition` function takes a predicate a list and returns the pair of
 * lists of elements which do and do not satisfy the predicate, respectively.
 *
 * ```haskell
 * >>> partition (`elem` "aeiou") "Hello World!"
 * ("eoo","Hll Wrld!")
 * ```
 */
export const ipartition =
  <A>
  (pred: (index: number) => (value: A) => boolean) =>
    ifoldr<A, Pair<List<A>, List<A>>>
      (i => x => pred (i) (x) ? first (consF (x)) : second (consF (x)))
      (fromBinary (Nil, Nil))

// Search

interface Ifind {
  /**
   * `ifind :: Foldable t => (Int -> a -> Bool) -> t a -> Maybe a`
   *
   * The `find` function takes a predicate and a structure and returns the
   * leftmost element of the structure matching the predicate, or `Nothing` if
   * there is no such element.
   */
  <A, A1 extends A>
  (pred: (index: number) => (x: A) => x is A1):
  (xs: List<A>) => Maybe<A1>

  /**
   * `ifind :: Foldable t => (Int -> a -> Bool) -> t a -> Maybe a`
   *
   * The `find` function takes a predicate and a structure and returns the
   * leftmost element of the structure matching the predicate, or `Nothing` if
   * there is no such element.
   */
  <A> (pred: (index: number) => (x: A) => boolean): (xs: List<A>) => Maybe<A>
}

/**
 * `ifind :: Foldable t => (Int -> a -> Bool) -> t a -> Maybe a`
 *
 * The `find` function takes a predicate and a structure and returns the
 * leftmost element of the structure matching the predicate, or `Nothing` if
 * there is no such element.
 */
export const ifind: Ifind =
  <A> (pred: (index: number) => (x: A) => boolean) => (xs: List<A>): Maybe<A> =>
    ifindIterator (pred) (0) (xs)

const ifindIterator =
  <A>
  (pred: (index: number) => (x: A) => boolean) =>
  (index: number) =>
  (xs: List<A>): Maybe<A> =>
    isNil (xs)
    ? Nothing
    : pred (index) (xs .x)
    ? Just (xs .x)
    : ifindIterator (pred) (index + 1) (xs .xs)

/**
 * `ifindIndex :: (Int -> a -> Bool) -> [a] -> Maybe Int`
 *
 * The `ifindIndex` function takes a predicate and a list and returns the
 * index of the first element in the list satisfying the predicate, or
 * `Nothing` if there is no such element.
 */
export const ifindIndex =
  <A>
  (pred: (index: number) => (x: A) => boolean) =>
  (xs: List<A>): Maybe<number> =>
    ifindIndexNode (pred) (0) (xs)

const ifindIndexNode =
  <A>
  (pred: (index: number) => (x: A) => boolean) =>
  (index: number) =>
  (xs: List<A>): Maybe<number> =>
    isNil (xs)
    ? Nothing
    : pred (index) (xs .x)
    ? Just (index)
    : ifindIndexNode (pred) (index + 1) (xs .xs)

/**
 * `ifindIndices :: (a -> Bool) -> [a] -> [Int]`
 *
 * The `ifindIndices` function extends `findIndex`, by returning the indices
 * of all elements satisfying the predicate, in ascending order.
 */
export const ifindIndices =
  <A>
  (pred: (index: number) => (x: A) => boolean) =>
  (xs: List<A>): List<number> =>
    ifindIndicesNode (pred) (0) (xs)

const ifindIndicesNode =
  <A>
  (pred: (index: number) => (x: A) => boolean) =>
  (index: number) =>
  (xs: List<A>): List<number> =>
    isNil (xs)
    ? Nil
    : pred (index) (xs .x)
    ? Cons (index, ifindIndicesNode (pred) (index + 1) (xs .xs))
    : ifindIndicesNode (pred) (index + 1) (xs .xs)


// LIST.EXTRA

// String operations

/**
 * `lower :: String -> String`
 *
 * Convert a string to lower case.
 */
export const lower = (str: string) => str .toLowerCase ()


// Splitting

/**
 * `splitOn :: (Partial, Eq a) => [a] -> [a] -> [[a]]`
 *
 * Break a list into pieces separated by the first list argument, consuming the
 * delimiter. An empty delimiter is invalid, and will cause an error to be
 * raised.
 */
export const splitOn =
  (del: string) => (x: string): List<string> =>
    fromArray (x .split (del))


// Basics

/**
 * `notNull :: [a] -> Bool`
 *
 * A composition of `not` and `null`.
 */
export const notNull =
  pipe (fnull, not) as <A> (xs: List<A>) => xs is NonEmptyList<A>

/**
 * `notNull :: String -> Bool`
 *
 * A composition of `not` and `null`.
 */
export const notNullStr = (xs: string) => xs .length > 0

/**
 * `list :: b -> (a -> [a] -> b) -> [a] -> b`
 *
 * Non-recursive transform over a list, like `maybe`.
 *
 * ```haskell
 * ist 1 (\v _ -> v - 2) [5,6,7] == 3
 * ist 1 (\v _ -> v - 2) []      == 1
 * nil cons xs -> maybe nil (uncurry cons) (uncons xs) == list nil cons xs
 * ```
 */
export const list =
  <A, B> (def: B) => (f: (x: A) => (xs: List<A>) => B) => (xs: List<A>): B =>
    isNil (xs) ? def : f (xs .x) (xs .xs)

/**
 * `cons :: a -> [a] -> [a]`
 *
 * Prepends an element to the list.
 *
 * Flipped version of `(:)`.
 */
export const consF = <A> (x: A) => (xs: List<A>): List<A> => cons (xs) (x)

/**
 * `snoc :: [a] -> a -> [a]`
 *
 * Append an element to the end of a list, takes *O(n)* time.
 */
export const snoc =
  <A> (xs: List<A>) => (x: A): List<A> =>
    isNil (xs) ? pure (x) : snocSafe (xs) (x)

const snocSafe =
  <A> (xs: Cons<A>) => (x: A): Cons<A> =>
    isNil (xs .xs)
    ? Cons (xs .x, pure (x))
    : Cons (xs .x, snocSafe (xs .xs) (x))


// List operations

/**
 * `maximumOn :: Ord b => (a -> b) -> [a] -> Maybe a`
 *
 * A version of `maximum` where the comparison is done on some extracted value.
 *
 * Original `maximumOn :: Ord b => (a -> b) -> [a] -> a`.
 */
export const maximumOn =
  <A> (f: (x: A) => number) =>
    pipe (
      foldr<A, Pair<Maybe<A>, number>>
        (x => acc => {
          const res = f (x)

          return res > snd (acc) ? Pair.fromBinary (Just (x), res) : acc
        })
        (Pair.fromBinary (Nothing, -Infinity)),
      fst
    )

/**
 * `minimumOn :: Ord b => (a -> b) -> [a] -> Maybe a`
 *
 * A version of `minimum` where the comparison is done on some extracted value.
 *
 * Original `minimumOn :: Ord b => (a -> b) -> [a] -> a`.
 */
export const minimumOn =
  <A> (f: (x: A) => number) =>
    pipe (
      foldr<A, Pair<Maybe<A>, number>>
        (x => acc => {
          const res = f (x)

          return res < snd (acc) ? Pair.fromBinary (Just (x), res) : acc
        })
        (Pair.fromBinary (Nothing, Infinity)),
      fst
    )

/**
 * `firstJust :: (a -> Maybe b) -> [a] -> Maybe b`
 *
 * Find the first element of a list for which the operation returns `Just`,
 * along with the result of the operation. Like `find` but useful where the
 * function also computes some expensive information that can be reused.
 * Particular useful when the function is monadic, see `firstJustM`.
 *
 * ```haskell
 * firstJust id [Nothing,Just 3]  == Just 3
 * firstJust id [Nothing,Nothing] == Nothing
 * ```
 */
export const firstJust =
  <A, B> (pred: (x: A) => Maybe<B>) => (xs: List<A>): Maybe<B> => {
    if (isNil (xs)) {
      return Nothing
    }

    const res = pred (xs .x)

    if (isJust (res)) {
      return res
    }

    return firstJust (pred) (xs .xs)
  }


// OWN METHODS

/**
 * `unsafeIndex :: [a] -> Int -> a`
 *
 * Unsafe list index operator, starting from 0. If the index is invalid this
 * function throws an error, otherwise returns `a`.
 */
export const unsafeIndex =
  <A> (xs: List<A>) => (index: number): A => {
    if (isNil (xs)) {
      throw new RangeError (
        `List.unsafeIndex: The index exceeds the length of the list.`
      )
    }

    if (index < 0) {
      throw new Error (
        `List.unsafeIndex: Negative index provided to `
        + `unsafeIndex. (${index})`
      )
    }

    if (index === 0) {
      return xs .x
    }

    return unsafeIndex (xs .xs) (index - 1)
  }

/**
 * Converts a `List` to a native Array.
 */
export const toArray = <A> (xs: List<A>): A[] =>
  foldl<A, A[]> (arr => x => [...arr, x]) ([]) (xs)

/**
 * Checks if the given value is a `List`.
 * @param x The value to test.
 */
export const isList =
  (x: any): x is List<any> =>
    Object.getPrototypeOf (x) === ListPrototype

/**
 * Returns the sum of all elements of the list that match the provided
 * predicate.
 */
export const countWith =
  <A> (pred: (x: A) => boolean) => pipe (filter (pred), length)

/**
 * The largest element of a non-empty structure. The minimum value returned is
 * `0`.
 */
export const maximumNonNegative = pipe (consF (0), maximum)


// NAMESPACED FUNCTIONS

export const List = {
  fromElements,
  fromArray,

  fmap,
  mapReplace,

  pure,
  ap,

  alt,
  altF,
  empty,
  guard,

  bind,
  bindF,
  then,
  kleisli,
  join,

  foldr,
  foldl,
  toList,
  fnull,
  length,
  elem,
  elemF,
  sum,
  product,
  concat,
  concatMap,
  and,
  or,
  any,
  all,
  notElem,
  notElemF,
  find,

  append,
  appendStr,
  cons,
  head,
  last,
  lastS,
  tail,
  tailS,
  init,
  initS,
  uncons,

  map,
  reverse,
  intercalate,

  scanl,

  mapAccumL,

  unfoldr,

  take,
  drop,
  splitAt,

  lookup,

  filter,
  partition,

  subscript,
  subscriptF,
  elemIndex,
  elemIndices,
  findIndex,
  findIndices,

  zip,
  zipWith,

  lines,

  sdelete,

  sortBy,

  indexed,
  deleteAt,
  setAt,
  modifyAt,
  updateAt,
  insertAt,

  imap,

  ifoldr,
  ifoldl,
  iall,
  iany,
  iconcatMap,

  ifilter,
  ipartition,
  ifind,
  ifindIndex,
  ifindIndices,

  lower,
  splitOn,
  consF,
  snoc,

  maximumOn,
  minimumOn,
  firstJust,

  unsafeIndex,
  toArray,
  isList,
  countWith,
  maximumNonNegative,
}


// TYPE HELPERS

export type ListI<A> = A extends Cons<infer AI> ? AI : never