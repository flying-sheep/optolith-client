/* eslint "@typescript-eslint/type-annotation-spacing": [2, { "before": true, "after": true }] */
import { second } from "../../../../Data/Either"
import { fromArray } from "../../../../Data/List"
import { fromMap } from "../../../../Data/OrderedMap"
import { Record } from "../../../../Data/Record"
import { PactCategory } from "../../../Models/Wiki/PactCategory"
import { PactDomain } from "../../../Models/Wiki/PactDomain"
import { PactType } from "../../../Models/Wiki/PactType"
import { pipe } from "../../pipe"
import { map } from "../Array"
import { toMapIntegrity } from "../EntityIntegrity"
import { PactL10n } from "../Schema/Pacts/Pacts.l10n"
import { YamlFileConverter } from "../ToRecordsByFile"


const toPact : (l10n : PactL10n) => [number, Record<PactCategory>]
                  = l10n => [
                      l10n.id,
                      PactCategory ({
                        id: l10n.id,
                        name: l10n.name,
                        types: fromArray (l10n.types .map (PactType)),
                        domains: fromArray (l10n.domains .map (PactDomain)),
                      }),
                    ]


export const toPacts : YamlFileConverter<number, Record<PactCategory>>
                          = pipe (
                              yaml_mp => yaml_mp.PactsL10n,
                              map (toPact),
                              toMapIntegrity,
                              second (fromMap)
                            )
