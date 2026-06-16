/**
 * CTRM Blog 首页杂志版面 (Editorial Bento Grid) 与二级目录自适应背景重排脚本
 */
document.addEventListener('DOMContentLoaded', function () {
  // -------------------------------------------------------------
  // 1. 全局 Banner 动态自适应 (二级目录/特定分类背景图智能适配)
  // -------------------------------------------------------------
  const bannerElement = document.querySelector('#banner');
  if (bannerElement) {
    const path = window.location.pathname;
    const decodedPath = decodeURIComponent(path);
    let targetBanner = null;

    // 只有在非首页且非整体归档归类总页时，才启动二级目录自适应头图
    const isHomePage = path === '/' || path === '/index.html' || path === '' || path.includes('/page/');
    if (!isHomePage && !path.startsWith('/archives')) {
      // A. 优先根据当前路径匹配（如果是分类列表视图，已经URL解码）
      if (decodedPath.includes('/categories/CTRM')) {
        targetBanner = "url('/img/ctrm-sub-banner.svg')";
      } else if (decodedPath.includes('/categories/编程') || decodedPath.includes('/categories/Programing')) {
        targetBanner = "url('/img/tech-sub-banner.svg')";
      } else if (decodedPath.includes('/categories/日常') || decodedPath.includes('/categories/学问') || decodedPath.includes('/categories/Opinion')) {
        targetBanner = "url('/img/daily-sub-banner.svg')";
      }

      // B. 若路径未匹配上，则智能探查页面包含的分类元数据（适配具体文章页面详情头图）
      if (!targetBanner) {
        const metaAnchors = document.querySelectorAll('.post-meta a, .category-chains a, .post-metas a, #board a');
        for (const a of metaAnchors) {
          const href = decodeURIComponent(a.getAttribute('href') || '');
          if (href.includes('/categories/CTRM')) {
            targetBanner = "url('/img/ctrm-sub-banner.svg')";
            break;
          } else if (href.includes('/categories/编程') || href.includes('/categories/Programing')) {
            targetBanner = "url('/img/tech-sub-banner.svg')";
            break;
          } else if (href.includes('/categories/日常') || href.includes('/categories/学问') || href.includes('/categories/Opinion')) {
            targetBanner = "url('/img/daily-sub-banner.svg')";
            break;
          }
        }
      }

      // C. 动态静默注入自适应高级矢量背景
      if (targetBanner) {
        bannerElement.style.background = `${targetBanner} no-repeat center center`;
        bannerElement.style.backgroundSize = "cover";
      }
    }
  }

  // -------------------------------------------------------------
  // 2. 首页杂志版面 (Editorial Bento Grid) 动力学重排
  // -------------------------------------------------------------
  // 匹配 Hexo Fluid 首页用来包裹卡片的容器 (.col-12.col-md-10.m-auto)
  const indexContainer = document.querySelector('main .container .row .col-12.col-md-10.m-auto');
  if (!indexContainer) return;

  // 严谨检验：只有容器中确实含有首卡（.index-card），才认定是首页列表流并进行 Grid 重置与清空重排
  const cardsArray = Array.from(indexContainer.querySelectorAll('.index-card'));
  if (cardsArray.length === 0) return;

  // 将文章容器声明为 Grid 容器，实现精美 Bento 网格
  indexContainer.style.display = 'grid';
  indexContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
  indexContainer.style.gap = '25px';
  indexContainer.style.width = '100%';
  indexContainer.style.maxWidth = '100%';
  indexContainer.style.padding = '10px 0';

  // 定义各大主题的聚合权重（权重越小排越前，主线 CTRM 置顶）
  const getThemeWeight = (card) => {
    const html = card.innerHTML;
    if (html.includes('categories/CTRM/')) {
      return 10; // CTRM
    }
    if (html.includes('categories/%E7%BC%96%E7%A8%8B/') || html.includes('categories/Programing/')) {
      return 20; // 编程技术
    }
    if (html.includes('categories/%E6%97%A5%E5%B8%B8/') || html.includes('categories/%E5%AD%A6%E9%97%AE/')) {
      return 30; // 日常/人文
    }
    return 40;
  };

  // 进行双重级别排序：第一按【主题所属大类】，第二同类中按【时间戳由新到旧】
  cardsArray.sort((a, b) => {
    const weightA = getThemeWeight(a);
    const weightB = getThemeWeight(b);
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    const dateA = a.querySelector('time')?.getAttribute('datetime') || '';
    const dateB = b.querySelector('time')?.getAttribute('datetime') || '';
    return dateB.localeCompare(dateA); // 时间离现在最近的排前面
  });

  // 创建精美的区域分割线标题函数
  const createSectionHeader = (title, englishTitle, subtitle, number) => {
    const header = document.createElement('div');
    header.className = 'bento-section-header';
    header.style.gridColumn = 'span 2'; // 强行跨两列占满
    header.innerHTML = `
      <div class="header-tag-box">
        <span class="header-number">${number}</span>
        <div class="header-title-wrap">
          <h3 class="header-main-title">${title} <span class="header-eng-sub">${englishTitle}</span></h3>
          <p class="header-subtitle-desc">${subtitle}</p>
        </div>
      </div>
      <div class="header-divider-line"></div>
    `;
    return header;
  };

  // 清空容器，按主题分组并重新挂载，中途动态插接“Section Headers”
  indexContainer.innerHTML = '';

  let currentWeight = 0;
  cardsArray.forEach((card) => {
    const weight = getThemeWeight(card);
    
    // 一旦权重发生跃迁，说明跨越到了新的频道，动态插接视觉分割线
    if (weight !== currentWeight) {
      currentWeight = weight;
      if (weight === 10) {
        indexContainer.appendChild(createSectionHeader('CTRM 业务与风控研究', 'Commodity Trading & Risk Management', '探讨大宗商品现货开单、实货虚货轧差敞口、VaR极值风控计算与定价引擎的业务与物理世界映射', 'CH 01'));
      } else if (weight === 20) {
        indexContainer.appendChild(createSectionHeader('数字化工程实验室', 'Engineering & Tech Lab', '高性能列存数据库（ClickHouse）、高并发Thrift多协议微服务与 .NET 企业级应用落地', 'CH 02'));
      } else if (weight === 30) {
        indexContainer.appendChild(createSectionHeader('人文思考与随想', 'Humanity Thoughts & Essays', '知行合一的行知境界、极客生活观照以及技术以外的温度与感知', 'CH 03'));
      }
    }
    indexContainer.appendChild(card);
  });

  // 对排好序的卡片统一执行 Bento 网格渲染设置
  const finalCards = indexContainer.querySelectorAll('.index-card');
  finalCards.forEach((card) => {
    card.classList.add('bento-card');

    const catText = card.innerHTML;
    const isCTRM = catText.includes('categories/CTRM/');

    if (isCTRM) {
      card.style.gridColumn = 'span 2';
      card.classList.add('ctrm-hero-card');
    } else {
      card.style.gridColumn = 'span 1';
      card.classList.add('sub-bento-card');
    }

    // 针对移动端做响应式单列退化
    const handleResize = () => {
      const headers = indexContainer.querySelectorAll('.bento-section-header');
      if (window.innerWidth < 768) {
        indexContainer.style.gridTemplateColumns = '1fr';
        card.style.gridColumn = 'span 1';
        headers.forEach(h => h.style.gridColumn = 'span 1');
      } else {
        indexContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        if (isCTRM) {
          card.style.gridColumn = 'span 2';
        } else {
          card.style.gridColumn = 'span 1';
        }
        headers.forEach(h => h.style.gridColumn = 'span 2');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 优先调用一次
  });
});
