import type { Metadata } from "next";
import { UrlPolicyForm } from "@/features/url-policy/components/url-policy-form";

export const metadata: Metadata = {
  title: "Kiểm tra liên kết | ToolHub",
  description:
    "Kiểm tra tên miền ToolHub và dịch vụ rút gọn trước khi tạo link.",
};

const cleanExtensionAttributesScript = `
(function() {
  if (typeof window === 'undefined') return;

  try {
    var origSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, value) {
      if (name === 'bis_skin_checked' || name === 'bis_register') return;
      return origSetAttribute.apply(this, arguments);
    };
  } catch (e) {}

  try {
    var clean = function(node) {
      if (!node || node.nodeType !== 1) return;
      if (node.hasAttribute('bis_skin_checked')) node.removeAttribute('bis_skin_checked');
      if (node.hasAttribute('bis_register')) node.removeAttribute('bis_register');
      var children = node.querySelectorAll ? node.querySelectorAll('[bis_skin_checked], [bis_register]') : [];
      for (var i = 0; i < children.length; i++) {
        children[i].removeAttribute('bis_skin_checked');
        children[i].removeAttribute('bis_register');
      }
    };

    var observer = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'attributes') {
          if (m.attributeName === 'bis_skin_checked' || m.attributeName === 'bis_register') {
            m.target.removeAttribute(m.attributeName);
          }
        } else if (m.type === 'childList') {
          for (var j = 0; j < m.addedNodes.length; j++) {
            clean(m.addedNodes[j]);
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['bis_skin_checked', 'bis_register'],
      childList: true,
      subtree: true
    });
  } catch (e) {}

  try {
    var origConsoleError = console.error;
    console.error = function() {
      for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (typeof arg === 'string' && (arg.indexOf('bis_skin_checked') !== -1 || arg.indexOf('bis_register') !== -1)) {
          return;
        }
      }
      return origConsoleError.apply(console, arguments);
    };
  } catch (e) {}
})();
`;

export default function UrlCheckPage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: cleanExtensionAttributesScript,
        }}
      />
      <UrlPolicyForm />
    </>
  );
}
