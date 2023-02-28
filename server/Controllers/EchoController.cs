using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace server.Controllers
{
    public class EchoController : Controller
    {
        [Route("/")]
        public IActionResult Index()
        {

            return View("~/Views/index.cshtml");
        }

        [Route("/404")]
        public IActionResult NotFound404()
        {

            return View("~/Views/404.cshtml");
        }

        [Route("/post/{postId}")]
        public IActionResult RenderPost(int postId)
        {
            var Model = getPostByService(postId);
            return View("~/Views/post/{postId}.cshtml", Model);
        }

        [Route("/api/post/{postId}")]
        public object getPost(int postId)
        {
            return getPostByService(postId);
        }

        public object getPostByService(int postId)
        {
            return new
            {
                context = new
                {
                    query = new
                    {
                        postId = postId
                    }
                },
                data = new
                {
                    basic = new
                    {
                        name = "张三",
                        age = 48
                    },
                    children = new[] {
                    new {
                         name = "女儿1",
                         age = 7,
                    },
                    new {
                         name = "女儿2",
                         age = 4,
                    }
                }
                }
            };
        }
    }

}
