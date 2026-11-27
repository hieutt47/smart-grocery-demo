import {useState} from 'react';
import {RECIPE_PHOTOS} from './recipe-photos';

export function RecipePhotoCredit({recipeId}: {recipeId: string}) {
  const photo = Object.hasOwn(RECIPE_PHOTOS, recipeId) ? RECIPE_PHOTOS[recipeId] : undefined;
  if (!photo) return null;
  return (
    <p className="recipe-photo-credit">
      Ảnh: <a href={photo.attributionUrl || photo.source}>{photo.author}</a>
      {' · '}<a href={photo.licenseUrl}>{photo.license}</a>
      {' · '}Thu nhỏ, chuyển WebP và cắt khung hiển thị.
    </p>
  );
}

function inferDishEmoji(id: string): string {
  const k = id.toLowerCase();
  if (k.includes('salad')) return '🥗';
  if (k.includes('canh') || k.includes('sup') || k.includes('chao')) return '🍲';
  if (k.includes('mi-') || k.includes('mien-') || k.includes('bun-') || k.includes('pho')) return '🍜';
  if (k.includes('com-chien') || k.includes('com-')) return '🍛';
  if (k.includes('tom')) return '🍤';
  if (k.includes('ca-')) return '🐟';
  if (k.includes('ga')) return '🍗';
  if (k.includes('bo')) return '🥩';
  if (k.includes('trung') || k.includes('yen-mach')) return '🍳';
  if (k.includes('dau-hu')) return '🥘';
  if (k.includes('rau') || k.includes('cai') || k.includes('nam') || k.includes('bi-do')) return '🥬';
  return '🍲';
}

function inferPlateTheme(id: string, color?: string): string {
  if (color && ['green', 'yellow', 'peach', 'rose', 'blue'].includes(color)) return color;
  const k = id.toLowerCase();
  if (k.includes('salad') || k.includes('rau') || k.includes('cai')) return 'green';
  if (k.includes('trung') || k.includes('mi-') || k.includes('ga')) return 'yellow';
  if (k.includes('bo') || k.includes('tom') || k.includes('sot-ca')) return 'rose';
  if (k.includes('ca-') || k.includes('canh')) return 'blue';
  return 'peach';
}

export function RecipeVisual({
  recipe,
  className = 'recipe-photo-cover',
  decorative = false,
  eager = false
}: {
  recipe: {id: string; name: string; emoji?: string; color?: string};
  className?: string;
  decorative?: boolean;
  eager?: boolean;
}) {
  const photo = Object.hasOwn(RECIPE_PHOTOS, recipe.id) ? RECIPE_PHOTOS[recipe.id] : undefined;
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const available = photo && failedSource !== photo.large;
  const theme = inferPlateTheme(recipe.id, recipe.color);
  const emoji = recipe.emoji || inferDishEmoji(recipe.id);

  return (
    <div
      className={`recipe-art-wrap ${available ? 'recipe-photo-frame' : 'recipe-photo-fallback'} ${className}`}
      data-recipe-id={recipe.id}
      data-photo-status={available ? 'available' : 'missing'}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : available ? `Ảnh món ${recipe.name}` : `Món ${recipe.name}`}
      aria-hidden={decorative ? true : undefined}
    >
      {available ? (
        <img
          src={photo.large}
          srcSet={`${photo.small} ${photo.smallWidth}w, ${photo.large} ${photo.width}w`}
          sizes="(max-width: 680px) calc(100vw - 48px), (max-width: 1100px) 50vw, 420px"
          width={photo.width}
          height={photo.height}
          alt=""
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          style={{objectPosition: photo.position || 'center'}}
          onError={() => setFailedSource(photo.large)}
        />
      ) : (
        <div className={`recipe-plate-art plate-theme-${theme}`} aria-hidden="true">
          <span className="recipe-plate-outer">
            <span className="recipe-plate-inner">
              <span className="recipe-plate-emoji">{emoji}</span>
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
