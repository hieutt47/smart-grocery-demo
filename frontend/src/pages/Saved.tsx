import {Link} from 'react-router-dom';
import {ArrowRight, Sparkles} from 'lucide-react';
import {Empty, LoadState, PageTitle, RecipeCard} from '../components';
import {useResource, useStore} from '../context';
import type {Recipe} from '../types';

export function SavedRecipes() {
  const resource = useResource<Recipe[]>('/recipes');
  const {savedIds} = useStore();

  const savedList = (resource.data || []).filter(r => savedIds.includes(r.id));

  return (
    <div className="saved-page">
      <PageTitle
        eyebrow="Bộ sưu tập cá nhân"
        title="Món ăn đã lưu"
        description="Những món hợp gu bạn đã đánh dấu để nấu lại hoặc tham khảo nhanh cho bữa trưa, bữa tối."
      />

      <LoadState {...resource} />

      {resource.data && !resource.loading && (
        <>
          {savedList.length > 0 ? (
            <>
              <div className="list-meta">
                <span className="list-count" aria-live="polite">
                  <strong>{savedList.length}</strong> món đã lưu trên thiết bị này
                </span>
                <Link className="text-link" to="/assistant">
                  <Sparkles size={14} aria-hidden="true" />
                  <span>Nhờ AI gợi ý thêm</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
              <div className="recipe-grid">
                {savedList.map(r => (
                  <RecipeCard recipe={r} key={r.id} />
                ))}
              </div>
            </>
          ) : (
            <Empty
              title="Chưa có món nào được lưu"
              text="Hãy bấm biểu tượng trái tim ở các món bạn thích để lưu lại xem nhanh mỗi ngày."
              to="/recipes"
              label="Khám phá góc bếp"
            />
          )}
        </>
      )}
    </div>
  );
}
