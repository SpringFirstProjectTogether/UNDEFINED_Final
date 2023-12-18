package com.lec.spring.controller.community;

import com.lec.spring.config.PrincipalDetails;
import com.lec.spring.service.community.FeedService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/temp")
public class TempFeedController {

    FeedService feedService;

    public TempFeedController(FeedService feedService) {
        this.feedService = feedService;
    }


    @RequestMapping("/list")
    public String list(Integer page, Model model, @AuthenticationPrincipal PrincipalDetails userDetails) {
        if(userDetails != null)
            feedService.listByUserId(userDetails.getUser().getId(), page, model, "temp");
        return "community/myTempFeed";
    }

    @RequestMapping("/deleteAll")
    public String deleteAll(Model model, @AuthenticationPrincipal PrincipalDetails userDetails) {
        int result = feedService.deleteFeedAllByUserId(userDetails.getUser().getId(), "temp");
        model.addAttribute("result", result);

        return "redirect:/temp/list";
    }


    @PostMapping("/delete")
    public String delete(
            Long feedId,
            Model model
    ) {
        int result = feedService.deleteFeed(feedId);
        model.addAttribute("result", result);

        return "redirect:/temp/list";
    }

}
