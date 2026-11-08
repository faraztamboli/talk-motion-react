import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import useModels from "./useModels";
import { selectModel } from "../app/features/modelSlice";

/**
 * When the model picker is hidden (legacy_models_visible off), the Translator still needs a
 * vocabulary. Pick the first model the user can use, the same rule ModelsDropdown applies
 * when nothing is selected.
 */
export default function useDefaultModel(enabled) {
  const dispatch = useDispatch();
  const modelId = useSelector((state) => state.model.modelId);
  const serverConnected = useSelector((state) => state.server.serverConnected);
  const { getModelsUserCanUse } = useModels();

  useEffect(() => {
    if (!enabled || modelId || !serverConnected) return undefined;
    let cancelled = false;
    getModelsUserCanUse("", 0, 999999)
      .then((res) => {
        const first = res?.[0]?.[0];
        if (!cancelled && first) dispatch(selectModel(first.id));
      })
      .catch((err) => console.log(err));
    return () => {
      cancelled = true;
    };
  }, [enabled, modelId, serverConnected]);
}
